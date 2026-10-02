import { visibilityLimits } from '../../../src/data/visibility.js';
import type { Scene } from './scene.js';
import { Mesh } from './mesh.js';
import { InstancedMesh } from './instanced-mesh.js';
import { SkinnedMesh } from './skinned-mesh.js';
import { Frustum } from './frustum.js';
import { LOD, projectedSphereDiameter } from './objects3d.js';
import type { Camera3D } from './orthographic-camera.js';
import type { Object3D } from './object3d.js';
import { PBRMaterial } from './pbr-material.js';
import {
  sphereIsFinite,
  transformSphere,
  transformSphereElements,
  type BoundingSphere3D,
} from './render-bounds.js';

export interface VisibleInstances {
  /** Capacity-sized arrays; only the first count elements/matrices/colors are valid. */
  readonly indices: Uint32Array;
  readonly matrices: Float32Array;
  colors: Float32Array | undefined;
  count: number;
  /** Changes when packed payload or visible membership changes, not merely on a new frame. */
  version: number;
}

export interface RenderVisibilityEntry {
  readonly mesh: Mesh;
  readonly sphere: BoundingSphere3D;
  fade: number;
  instances: VisibleInstances | undefined;
}

/** A solid enclosing world AABB, inflated away from the candidate's own depth. */
export interface OcclusionCandidate {
  readonly mesh: Mesh;
  epoch: number;
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface OcclusionProofSource {
  /** False only for a completed native zero-sample query with this exact epoch. */
  visible(mesh: Mesh, epoch: number): boolean;
}

export interface RenderVisibilityOptions {
  viewportHeight?: number;
  timeSeconds?: number;
  occlusion?: OcclusionProofSource;
  /** Invalidate proofs when native vertex deformation, depth state, or target size changes. */
  depthRevision?: number;
}

export class RenderVisibilitySet {
  readonly color: Mesh[] = [];
  readonly shadows: Mesh[] = [];
  readonly entries = new Map<Mesh, RenderVisibilityEntry>();
  readonly occlusionCandidates: OcclusionCandidate[] = [];
  meshChecks = 0;
  poseChecks = 0;
  boxTests = 0;
  sphereTests = 0;
  instanceTests = 0;
  frustumCulled = 0;
  occlusionCulled = 0;
  epoch = 0;
}

interface Record3D {
  entry: RenderVisibilityEntry;
  stamp: Float64Array;
  candidate: OcclusionCandidate;
  instanceVersion: number;
  colorVersion: number;
  drawable: boolean;
  colorVisible: boolean;
  seen: number;
}
interface Node3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  left: Node3D | undefined;
  right: Node3D | undefined;
  record: Record3D | undefined;
}

/**
 * Renderer-owned mesh index. Membership changes rebuild a balanced BVH; mutable poses are
 * checked and bounds refitted every gather. This does NOT promise zero pose work.
 */
export class RenderVisibilityCache {
  private scene: Scene | undefined;
  private revision = -1;
  private epoch = 0;
  private readonly records = new Map<Mesh, Record3D>();
  private readonly leaves: Record3D[] = [];
  private readonly lods = new Map<LOD, number>();
  private gatherFrame = 0;
  private root: Node3D | undefined;
  private readonly cameraStamp = new Float64Array(18).fill(NaN);
  private readonly localSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly worldSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly stampValues = new Float64Array(15);
  private readonly baseSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private frame = 0;

  collect(
    scene: Scene,
    camera: Camera3D,
    frustum: Frustum,
    out: RenderVisibilitySet,
    options: RenderVisibilityOptions = {},
  ): RenderVisibilitySet {
    const height = options.viewportHeight ?? 1;
    const time = options.timeSeconds ?? 0;
    if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(time))
      throw new RangeError(
        'Visibility requires positive viewport height and finite presentation time.',
      );
    out.color.length = out.shadows.length = out.occlusionCandidates.length = 0;
    out.meshChecks =
      out.poseChecks =
      out.boxTests =
      out.sphereTests =
      out.instanceTests =
        0;
    out.frustumCulled = out.occlusionCulled = 0;
    let changed = false;
    if (this.scene !== scene) {
      this.clear();
      this.scene = scene;
      changed = true;
    }
    if (this.revision !== scene.renderMeshRevision) {
      this.sync(scene.renderMeshes);
      this.revision = scene.renderMeshRevision;
      changed = true;
    }
    for (const mesh of out.entries.keys())
      if (!this.records.has(mesh)) out.entries.delete(mesh);
    ++this.gatherFrame;
    for (const mesh of this.records.keys()) {
      for (
        let parent: Object3D | undefined = mesh.parent;
        parent;
        parent = parent.parent
      )
        if (parent instanceof LOD) this.lods.set(parent, this.gatherFrame);
    }
    // Selection remains independent of inherited visibility, including inactive nested branches.
    for (const lod of this.lods.keys()) {
      if (this.lods.get(lod) !== this.gatherFrame) this.lods.delete(lod);
      else lod.updateForRender(camera, height, time);
    }
    for (const record of this.records.values()) {
      const entry = record.entry,
        mesh = entry.mesh;
      out.meshChecks++;
      out.poseChecks++;
      mesh.updateRenderDeformation();
      mesh.updateWorldMatrix();
      mesh.getWorldBoundingSphere(entry.sphere, false);
      let fade = 1;
      for (let parent = mesh.parent; parent; parent = parent.parent)
        if (parent instanceof LOD) fade *= parent.renderWeight(mesh);
      entry.fade = fade;
      record.colorVisible = false;
      record.drawable =
        mesh.worldVisible &&
        !mesh.material.texture.destroyed &&
        mesh.geometry.indices.length > 0 &&
        (mesh.material.opacity > 0 ||
          (mesh.material instanceof PBRMaterial &&
            mesh.material.alphaMode !== 'BLEND'));
      const stamp = record.stamp,
        matrix = mesh.worldMatrix.elements,
        s = entry.sphere;
      for (let i = 0; i < 16; i++) {
        if (!Object.is(stamp[i], matrix[i])) changed = true;
        stamp[i] = matrix[i];
      }
      const values = this.stampValues;
      values[0] = s.x;
      values[1] = s.y;
      values[2] = s.z;
      values[3] = s.radius;
      values[4] = record.drawable ? 1 : 0;
      values[5] = fade;
      values[6] = mesh.renderGeometry.version;
      values[7] = mesh.frustumCulled ? 1 : 0;
      values[8] = mesh.occlusionCulled ? 1 : 0;
      values[9] = mesh instanceof InstancedMesh ? mesh.version : 0;
      values[10] = mesh instanceof InstancedMesh ? mesh.colorVersion : 0;
      values[11] = mesh instanceof SkinnedMesh ? mesh.paletteVersion : 0;
      values[12] = mesh.material.texture.version;
      values[13] = mesh.material.opacity;
      values[14] =
        mesh.material instanceof PBRMaterial
          ? mesh.material.alphaMode === 'MASK'
            ? 1
            : mesh.material.alphaMode === 'BLEND'
              ? 2
              : 0
          : 0;
      for (let i = 0; i < values.length; i++) {
        if (!Object.is(stamp[16 + i], values[i])) changed = true;
        stamp[16 + i] = values[i]!;
      }
      out.entries.set(mesh, entry);
      // Shadows intentionally never inherit camera-frustum or occlusion rejection.
      if (record.drawable && mesh.castShadow) out.shadows.push(mesh);
    }
    const cameraMatrix = camera.matrix.elements;
    for (let i = 0; i < this.cameraStamp.length; i++) {
      const value =
        i < 16
          ? cameraMatrix[i]!
          : i === 16
            ? height
            : (options.depthRevision ?? 0);
      if (!Object.is(this.cameraStamp[i], value)) changed = true;
      this.cameraStamp[i] = value;
    }
    if (changed) ++this.epoch;
    out.epoch = this.epoch;
    if (!this.root && this.leaves.length) {
      let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;
      for (const record of this.leaves) {
        const s = record.entry.sphere;
        if (!sphereIsFinite(s)) continue;
        minX = Math.min(minX, s.x);
        maxX = Math.max(maxX, s.x);
        minY = Math.min(minY, s.y);
        maxY = Math.max(maxY, s.y);
        minZ = Math.min(minZ, s.z);
        maxZ = Math.max(maxZ, s.z);
      }
      const axis =
        maxX - minX >= maxY - minY && maxX - minX >= maxZ - minZ
          ? 'x'
          : maxY - minY >= maxZ - minZ
            ? 'y'
            : 'z';
      this.leaves.sort(
        (a, b) => a.entry.sphere[axis] - b.entry.sphere[axis] || 0,
      );
      this.root = this.build(0, this.leaves.length);
    }
    if (this.root) {
      this.refit(this.root);
      this.gather(this.root, camera, frustum, out, options, height);
    }
    // BVH traversal order must not change equal-depth/transparent insertion ordering.
    for (const record of this.records.values()) {
      if (record.colorVisible) out.color.push(record.entry.mesh);
      if (record.drawable) ++out.frustumCulled;
    }
    out.frustumCulled -= out.color.length + out.occlusionCulled;
    return out;
  }

  clear(): void {
    this.records.clear();
    this.leaves.length = 0;
    this.lods.clear();
    this.root = undefined;
    this.scene = undefined;
    this.revision = -1;
    this.cameraStamp.fill(NaN);
    // Keep monotonic epochs across scenes; a backend's late result can never match a new scene.
    ++this.epoch;
  }

  private sync(meshes: ReadonlySet<Mesh> | undefined): void {
    ++this.frame;
    if (meshes)
      for (const mesh of meshes) {
        let record = this.records.get(mesh);
        if (!record) {
          record = {
            entry: {
              mesh,
              sphere: { x: 0, y: 0, z: 0, radius: 0 },
              fade: 1,
              instances: undefined,
            },
            stamp: new Float64Array(31).fill(NaN),
            candidate: {
              mesh,
              epoch: 0,
              minX: 0,
              minY: 0,
              minZ: 0,
              maxX: 0,
              maxY: 0,
              maxZ: 0,
            },
            instanceVersion: -1,
            colorVersion: -1,
            drawable: false,
            colorVisible: false,
            seen: this.frame,
          };
        }
        // Remove/re-add between gathers must retain the Scene's new insertion order.
        this.records.delete(mesh);
        this.records.set(mesh, record);
        record.seen = this.frame;
      }
    for (const [mesh, record] of this.records)
      if (record.seen !== this.frame) this.records.delete(mesh);
    this.leaves.length = 0;
    for (const record of this.records.values()) this.leaves.push(record);
    this.root = undefined;
  }

  private build(start: number, end: number): Node3D {
    const node: Node3D = {
      minX: 0,
      minY: 0,
      minZ: 0,
      maxX: 0,
      maxY: 0,
      maxZ: 0,
      left: undefined,
      right: undefined,
      record: undefined,
    };
    if (end - start === 1) node.record = this.leaves[start]!;
    else {
      const middle = start + Math.floor((end - start) / 2);
      node.left = this.build(start, middle);
      node.right = this.build(middle, end);
    }
    return node;
  }

  private refit(node: Node3D): void {
    if (node.record) {
      const mesh = node.record.entry.mesh,
        s = node.record.entry.sphere;
      if (!mesh.frustumCulled || !sphereIsFinite(s)) {
        node.minX = node.minY = node.minZ = -Infinity;
        node.maxX = node.maxY = node.maxZ = Infinity;
      } else {
        node.minX = s.x - s.radius;
        node.maxX = s.x + s.radius;
        node.minY = s.y - s.radius;
        node.maxY = s.y + s.radius;
        node.minZ = s.z - s.radius;
        node.maxZ = s.z + s.radius;
      }
    } else {
      const left = node.left!,
        right = node.right!;
      this.refit(left);
      this.refit(right);
      node.minX = Math.min(left.minX, right.minX);
      node.maxX = Math.max(left.maxX, right.maxX);
      node.minY = Math.min(left.minY, right.minY);
      node.maxY = Math.max(left.maxY, right.maxY);
      node.minZ = Math.min(left.minZ, right.minZ);
      node.maxZ = Math.max(left.maxZ, right.maxZ);
    }
  }

  private gather(
    node: Node3D,
    camera: Camera3D,
    frustum: Frustum,
    out: RenderVisibilitySet,
    options: RenderVisibilityOptions,
    height: number,
  ): void {
    out.boxTests++;
    if (
      !frustum.intersectsBox(
        node.minX,
        node.minY,
        node.minZ,
        node.maxX,
        node.maxY,
        node.maxZ,
      )
    )
      return;
    if (!node.record) {
      this.gather(node.left!, camera, frustum, out, options, height);
      this.gather(node.right!, camera, frustum, out, options, height);
      return;
    }
    const record = node.record,
      entry = record.entry,
      mesh = entry.mesh,
      s = entry.sphere;
    if (!record.drawable) return;
    out.sphereTests++;
    if (
      mesh.frustumCulled &&
      sphereIsFinite(s) &&
      !frustum.intersectsSphere(s.x, s.y, s.z, s.radius)
    )
      return;
    if (
      mesh instanceof InstancedMesh &&
      !this.packInstances(record, mesh, frustum, out)
    )
      return;
    if (
      mesh.occlusionCulled &&
      options.occlusion &&
      sphereIsFinite(s) &&
      entry.fade === 1 &&
      projectedSphereDiameter(s, camera, height) >=
        visibilityLimits.minimumQueryPixels &&
      out.occlusionCandidates.length < visibilityLimits.occlusionQueries
    ) {
      const proxy = record.candidate;
      const r =
        s.radius +
        Math.max(
          visibilityLimits.proxyInflation,
          s.radius * visibilityLimits.proxyInflation,
          Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)) *
            visibilityLimits.proxyCoordinateInflation,
        );
      proxy.minX = s.x - r;
      proxy.maxX = s.x + r;
      proxy.minY = s.y - r;
      proxy.maxY = s.y + r;
      proxy.minZ = s.z - r;
      proxy.maxZ = s.z + r;
      proxy.epoch = this.epoch;
      // Any near-plane/eye intersection invalidates the solid-enclosure proof.
      const m = camera.matrix.elements;
      let safe = true;
      for (let i = 0; i < 8; i++) {
        const x = i & 1 ? proxy.maxX : proxy.minX;
        const y = i & 2 ? proxy.maxY : proxy.minY;
        const z = i & 4 ? proxy.maxZ : proxy.minZ;
        const w = m[3] * x + m[7] * y + m[11] * z + m[15];
        const depth = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (!(w > 0 && depth > 0)) {
          safe = false;
          break;
        }
      }
      if (safe) {
        out.occlusionCandidates.push(proxy);
        if (!options.occlusion.visible(mesh, this.epoch)) {
          out.occlusionCulled++;
          return;
        }
      }
    }
    record.colorVisible = true;
  }

  private packInstances(
    record: Record3D,
    mesh: InstancedMesh,
    frustum: Frustum,
    out: RenderVisibilitySet,
  ): boolean {
    let packed = record.entry.instances;
    if (!packed)
      record.entry.instances = packed = {
        indices: new Uint32Array(mesh.count),
        matrices: new Float32Array(mesh.count * 16),
        colors: undefined,
        count: 0,
        version: 0,
      };
    const sphere = mesh.geometry.boundingSphere,
      displacement = mesh.material.deformationBounds;
    const base = this.baseSphere;
    base.x = sphere.x;
    base.y = sphere.y;
    base.z = sphere.z;
    base.radius =
      displacement === undefined ? Infinity : sphere.radius + displacement;
    let count = 0,
      changed =
        record.instanceVersion !== mesh.version ||
        record.colorVersion !== mesh.colorVersion;
    for (let index = 0; index < mesh.count; index++) {
      out.instanceTests++;
      transformSphereElements(
        base,
        mesh.matrices,
        index * 16,
        this.localSphere,
      );
      const s = transformSphere(
        this.localSphere,
        mesh.worldMatrix,
        this.worldSphere,
      );
      if (
        mesh.frustumCulled &&
        sphereIsFinite(s) &&
        !frustum.intersectsSphere(s.x, s.y, s.z, s.radius)
      )
        continue;
      if (packed.indices[count] !== index) changed = true;
      packed.indices[count++] = index;
    }
    if (packed.count !== count) changed = true;
    packed.count = count;
    if (mesh.colors && !packed.colors) {
      packed.colors = new Float32Array(mesh.count * 3);
      changed = true;
    }
    if (changed) {
      for (let i = 0; i < count; i++) {
        const index = packed.indices[i]!;
        for (let j = 0; j < 16; j++)
          packed.matrices[i * 16 + j] = mesh.matrices[index * 16 + j]!;
        if (mesh.colors && packed.colors)
          for (let j = 0; j < 3; j++)
            packed.colors[i * 3 + j] = mesh.colors[index * 3 + j]!;
      }
      packed.version++;
      record.instanceVersion = mesh.version;
      record.colorVersion = mesh.colorVersion;
    }
    return count > 0;
  }
}

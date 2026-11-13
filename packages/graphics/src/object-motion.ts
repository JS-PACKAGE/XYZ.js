import { motionBlurDefaults } from '../../../src/data/rendering.js';
import { Matrix4 } from '../../math/src/index.js';
import type { Mesh } from '../../core/src/mesh.js';
import { InstancedMesh } from '../../core/src/instanced-mesh.js';
import { SkinnedMesh } from '../../core/src/skinned-mesh.js';
import { isNativeMaterial3D } from '../../core/src/native-material3d.js';
import type { TemporalPostState } from './temporal-post.js';

interface PoseHistory {
  frame: number;
  geometry: object;
  version: number;
  material: object;
  matrices: Matrix4[];
}
export interface ObjectMotionDraw {
  mesh: Mesh;
  /** Current and previous clip transforms, column-major. */
  data: Float32Array;
}

/** Clip inputs and draw storage are distinct; preserve Matrix4.multiply's arithmetic order. */
function writeClipTransform(
  out: Float32Array,
  offset: number,
  left: Matrix4,
  right: Matrix4,
): void {
  const a = left.elements,
    b = right.elements;
  const a00 = a[0]!,
    a01 = a[1]!,
    a02 = a[2]!,
    a03 = a[3]!;
  const a10 = a[4]!,
    a11 = a[5]!,
    a12 = a[6]!,
    a13 = a[7]!;
  const a20 = a[8]!,
    a21 = a[9]!,
    a22 = a[10]!,
    a23 = a[11]!;
  const a30 = a[12]!,
    a31 = a[13]!,
    a32 = a[14]!,
    a33 = a[15]!;
  for (let column = 0; column < 4; column++) {
    const i = column * 4;
    const b0 = b[i]!,
      b1 = b[i + 1]!,
      b2 = b[i + 2]!,
      b3 = b[i + 3]!;
    out[offset + i] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
    out[offset + i + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
    out[offset + i + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
    out[offset + i + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
  }
}

/** Renderer-owned rigid pose history. No object/material/geometry ownership is transferred. */
export class ObjectMotionHistory {
  private poses?: WeakMap<Mesh, PoseHistory>;
  private frame = 0;
  private readonly world = new Matrix4();
  private readonly instance = new Matrix4();
  private readonly draws: ObjectMotionDraw[] = [];
  private count = 0;

  build(
    meshes: readonly Mesh[],
    state: TemporalPostState,
  ): readonly ObjectMotionDraw[] {
    if (!state.reprojectionValid) this.invalidate();
    this.frame++;
    this.count = 0;
    for (const mesh of meshes) {
      // Deformed vertices do not have a corresponding previous rigid local point.
      if (
        mesh instanceof SkinnedMesh ||
        mesh.morph ||
        isNativeMaterial3D(mesh.material) ||
        mesh.material.deformationBounds !== 0 ||
        mesh.material.transparent
      )
        continue;
      const count = mesh instanceof InstancedMesh ? mesh.count : 1;
      let pose = this.poses?.get(mesh);
      const valid =
        pose?.frame === this.frame - 1 &&
        pose.geometry === mesh.renderGeometry &&
        pose.version === mesh.renderGeometry.version &&
        pose.material === mesh.material;
      if (!pose) {
        pose = {
          frame: 0,
          geometry: mesh.renderGeometry,
          version: mesh.renderGeometry.version,
          material: mesh.material,
          matrices: [],
        };
        (this.poses ??= new WeakMap()).set(mesh, pose);
      }
      for (let index = 0; index < count; index++) {
        this.world.copy(mesh.worldMatrix);
        if (mesh instanceof InstancedMesh) {
          mesh.getMatrixAt(index, this.instance);
          this.world.multiply(this.instance);
        }
        let previous = pose.matrices[index];
        if (valid && previous) {
          let draw = this.draws[this.count];
          if (!draw) {
            draw = { mesh, data: new Float32Array(32) };
            this.draws.push(draw);
          }
          draw.mesh = mesh;
          writeClipTransform(draw.data, 0, state.currentVP, this.world);
          writeClipTransform(draw.data, 16, state.previousVP, previous);
          this.count++;
        }
        if (!previous) pose.matrices[index] = previous = new Matrix4();
        previous.copy(this.world);
      }
      pose.frame = this.frame;
      pose.geometry = mesh.renderGeometry;
      pose.version = mesh.renderGeometry.version;
      pose.material = mesh.material;
    }
    // Release borrowed object references, retaining only useful draw storage.
    this.draws.length = this.count;
    return this.draws;
  }

  invalidate(): void {
    this.poses = undefined;
    this.draws.length = 0;
    this.count = 0;
    this.frame = 0;
  }
}

export const objectMotionWGSL = (samples: number): string => `
@group(0) @binding(0) var opaqueDepth: ${samples > 1 ? 'texture_depth_multisampled_2d' : 'texture_depth_2d'};
struct PoseInput {
 @location(0) position:vec3f,
 @location(1) current0:vec4f, @location(2) current1:vec4f, @location(3) current2:vec4f, @location(4) current3:vec4f,
 @location(5) previous0:vec4f, @location(6) previous1:vec4f, @location(7) previous2:vec4f, @location(8) previous3:vec4f,
};
struct Vertex { @builtin(position) position:vec4f, @location(0) current:vec4f, @location(1) previous:vec4f };
@vertex fn vertexMain(input:PoseInput)->Vertex {
 var out:Vertex; out.current=mat4x4f(input.current0,input.current1,input.current2,input.current3)*vec4f(input.position,1.0);
 out.previous=mat4x4f(input.previous0,input.previous1,input.previous2,input.previous3)*vec4f(input.position,1.0); out.position=out.current;
 return out;
}
@fragment fn fragmentMain(input:Vertex)->@location(0) vec4f {
 var depth=1.0;
 ${samples > 1 ? `for(var i=0;i<${samples};i++) { depth=min(depth,textureLoad(opaqueDepth,vec2i(input.position.xy),i)); }` : 'depth=textureLoad(opaqueDepth,vec2i(input.position.xy),0);'}
 if(abs(depth-input.position.z)>${motionBlurDefaults.velocityDepthTolerance}) { discard; }
 if(input.previous.w<=0.000001) { return vec4f(0.0); }
 return vec4f((input.current.xy/input.current.w-input.previous.xy/input.previous.w)*vec2f(0.5,-0.5),1.0,0.0);
}`;
export const objectMotionGLVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;
uniform mat4 currentClip;
uniform mat4 previousClip;
out vec4 currentPosition;
out vec4 previousPosition;
void main() { currentPosition=currentClip*vec4(position,1.0); previousPosition=previousClip*vec4(position,1.0);
 gl_Position=currentPosition; gl_Position.z=2.0*gl_Position.z-gl_Position.w; }
`;
export const objectMotionGLFragment = `#version 300 es
precision highp float;
uniform highp sampler2D opaqueDepth;
in vec4 currentPosition;
in vec4 previousPosition;
out vec4 velocity;
void main() {
 if(abs(texelFetch(opaqueDepth,ivec2(gl_FragCoord.xy),0).r-gl_FragCoord.z)>${motionBlurDefaults.velocityDepthTolerance}) discard;
 if(previousPosition.w<=.000001) { velocity=vec4(0.0); return; }
 velocity=vec4((currentPosition.xy/currentPosition.w-previousPosition.xy/previousPosition.w)*.5,1.0,0.0); }
`;

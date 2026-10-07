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

/** Renderer-owned rigid pose history. No object/material/geometry ownership is transferred. */
export class ObjectMotionHistory {
  private poses = new WeakMap<Mesh, PoseHistory>();
  private frame = 0;
  private readonly world = new Matrix4();
  private readonly instance = new Matrix4();
  private readonly clip = new Matrix4();
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
      let pose = this.poses.get(mesh);
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
        this.poses.set(mesh, pose);
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
          draw.data.set(
            this.clip.copy(state.currentVP).multiply(this.world).elements,
            0,
          );
          draw.data.set(
            this.clip.copy(state.previousVP).multiply(previous).elements,
            16,
          );
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
    this.poses = new WeakMap();
    this.draws.length = 0;
    this.count = 0;
    this.frame = 0;
  }
}

export const objectMotionWGSL = (samples: number): string => `
struct Pose { current:mat4x4f, previous:mat4x4f };
@group(0) @binding(0) var<uniform> pose:Pose;
@group(0) @binding(1) var opaqueDepth: ${samples > 1 ? 'texture_depth_multisampled_2d' : 'texture_depth_2d'};
struct Vertex { @builtin(position) position:vec4f, @location(0) current:vec4f, @location(1) previous:vec4f };
@vertex fn vertexMain(@location(0) position:vec3f)->Vertex {
 var out:Vertex; out.current=pose.current*vec4f(position,1.0);
 out.previous=pose.previous*vec4f(position,1.0); out.position=out.current;
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

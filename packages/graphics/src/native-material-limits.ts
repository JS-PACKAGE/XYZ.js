import { GraphicsError } from './errors.js';
import { SHADOW_FLOAT_COUNT } from '../../../src/data/rendering.js';

/** Native hooks use the engine's fixed bind/attribute ABI; they cannot add private resources. */
export function validateNativeMaterialGPU(limits: GPUSupportedLimits): void {
  const required: readonly [keyof GPUSupportedLimits, number][] = [
    ['maxVertexAttributes', 14],
    ['maxVertexBuffers', 6],
    ['maxBindGroups', 4],
    ['maxSampledTexturesPerShaderStage', 16],
    ['maxSamplersPerShaderStage', 13],
    ['maxStorageBuffersPerShaderStage', 1],
    ['maxUniformBuffersPerShaderStage', 4],
    ['maxUniformBufferBindingSize', SHADOW_FLOAT_COUNT * 4],
  ];
  for (const [name, minimum] of required)
    if (Number(limits[name]) < minimum)
      throw new GraphicsError(
        `NativeMaterial3D requires WebGPU ${name} >= ${minimum}; device reports ${limits[name]}.`,
      );
}

export function validateNativeMaterialGL(gl: WebGL2RenderingContext): void {
  const required: readonly [number, number, string][] = [
    [gl.MAX_VERTEX_ATTRIBS, 14, 'vertex attributes'],
    [gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS, 6, 'vertex texture units'],
    [gl.MAX_TEXTURE_IMAGE_UNITS, 16, 'fragment texture units'],
    [gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS, 17, 'combined texture units'],
    [gl.MAX_UNIFORM_BLOCK_SIZE, SHADOW_FLOAT_COUNT * 4, 'uniform block bytes'],
  ];
  for (const [parameter, minimum, label] of required) {
    const available = gl.getParameter(parameter) as number;
    if (available < minimum)
      throw new GraphicsError(
        `NativeMaterial3D requires WebGL2 ${label} >= ${minimum}; device reports ${available}.`,
      );
  }
}

/** GL silently initializes undeclared application uniforms to zero; reject that misleading fallback. */
export function validateNativeMaterialGLResources(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  allowed: readonly string[],
): void {
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    if (
      gl.getUniformLocation(program, info.name) !== null &&
      !allowed.includes(info.name)
    )
      throw new GraphicsError(
        `NativeMaterial3D resource ${info.name} is outside the fixed ABI; use xyzUniforms/xyzMap0..3.`,
      );
  }
  const blocks = gl.getProgramParameter(
    program,
    gl.ACTIVE_UNIFORM_BLOCKS,
  ) as number;
  for (let i = 0; i < blocks; i++) {
    const name = gl.getActiveUniformBlockName(program, i);
    if (name !== 'ShadowData' && name !== 'SheenLookup')
      throw new GraphicsError(
        `NativeMaterial3D uniform block ${name} is outside the fixed ABI.`,
      );
  }
}

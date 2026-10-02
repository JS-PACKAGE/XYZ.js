/** Native hooks use the engine's fixed bind/attribute ABI; they cannot add private resources. */
export declare function validateNativeMaterialGPU(limits: GPUSupportedLimits): void;
export declare function validateNativeMaterialGL(gl: WebGL2RenderingContext): void;
/** GL silently initializes undeclared application uniforms to zero; reject that misleading fallback. */
export declare function validateNativeMaterialGLResources(gl: WebGL2RenderingContext, program: WebGLProgram, allowed: readonly string[]): void;

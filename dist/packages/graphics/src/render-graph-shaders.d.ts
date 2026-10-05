/** Preserve the existing PostProcessor2D ABI and add named ordered attachments. */
export declare function graphWGSL(source: string, inputCount: number): string;
export declare function graphGLSL(source: string, inputCount: number): {
    vertex: string;
    fragment: string;
};
export declare const graphIdentityWGSL = "fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return color; }";
export declare const graphIdentityGLSL = "vec4 effect(vec4 color, vec2 uv, vec2 screen) { return color; }";

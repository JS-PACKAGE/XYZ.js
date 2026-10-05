export declare function temporalWGSL(sampleCount: number, taa: boolean): string;
export declare const temporalGLVertex = "#version 300 es\nprecision highp float;\nvoid main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(p*2.0-1.0,0,1); }";
export declare function temporalGLFragment(taa: boolean): string;

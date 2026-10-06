export const gradingGLSL=`
uniform sampler2D lutImage;
uniform vec2 grading;
uniform int toneOperator;
vec3 lutFetch(ivec3 p) { int n = int(grading.x); return texelFetch(lutImage, ivec2(p.z*n+p.x,p.y),0).rgb; }
vec3 grade(vec3 color) {
 if (grading.y <= 0.0) return color;
 vec3 p = clamp(color,0.0,1.0)*(grading.x-1.0); ivec3 a=ivec3(floor(p)), b=min(a+1,ivec3(int(grading.x)-1)); vec3 f=fract(p);
 vec3 c=mix(mix(mix(lutFetch(a),lutFetch(ivec3(b.x,a.y,a.z)),f.x),mix(lutFetch(ivec3(a.x,b.y,a.z)),lutFetch(ivec3(b.x,b.y,a.z)),f.x),f.y),mix(mix(lutFetch(ivec3(a.x,a.y,b.z)),lutFetch(ivec3(b.x,a.y,b.z)),f.x),mix(lutFetch(ivec3(a.x,b.y,b.z)),lutFetch(b),f.x),f.y),f.z);
 return mix(color,c,grading.y);
}
vec3 tone(vec3 c) {
 c=max(c,vec3(0.0));
 if(toneOperator==1) return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.0,1.0);
 if(toneOperator==2) { vec3 x=clamp((log2(max(c,vec3(.00001)))+10.0)/16.5,0.0,1.0); return x*x*(3.0-2.0*x); }
 if(toneOperator==3) return c/(1.0+c);
 if(toneOperator==4) { float peak=max(c.r,max(c.g,c.b)); return c/(1.0+peak); }
 return c;
}
`;export const gradingWGSL=`
@group(0) @binding(3) var lutImage: texture_2d<f32>;
fn lutFetch(p:vec3i)->vec3f { return textureLoad(lutImage,vec2i(p.z*i32(settings.grading.x)+p.x,p.y),0).rgb; }
fn grade(color:vec3f)->vec3f {
 if(settings.grading.y<=0.0) { return color; }
 let p=clamp(color,vec3f(0.0),vec3f(1.0))*(settings.grading.x-1.0); let a=vec3i(floor(p)); let b=min(a+vec3i(1),vec3i(i32(settings.grading.x)-1)); let f=fract(p);
 let c=mix(mix(mix(lutFetch(a),lutFetch(vec3i(b.x,a.y,a.z)),f.x),mix(lutFetch(vec3i(a.x,b.y,a.z)),lutFetch(vec3i(b.x,b.y,a.z)),f.x),f.y),mix(mix(lutFetch(vec3i(a.x,a.y,b.z)),lutFetch(vec3i(b.x,a.y,b.z)),f.x),mix(lutFetch(vec3i(a.x,b.y,b.z)),lutFetch(b),f.x),f.y),f.z);
 return mix(color,c,settings.grading.y);
}
fn tone(input:vec3f)->vec3f {
 let c=max(input,vec3f(0.0)); let op=i32(settings.values.y);
 if(op==1) { return clamp((c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14),vec3f(0.0),vec3f(1.0)); }
 if(op==2) { let x=clamp((log2(max(c,vec3f(0.00001)))+10.0)/16.5,vec3f(0.0),vec3f(1.0)); return x*x*(3.0-2.0*x); }
 if(op==3) { return c/(1.0+c); }
 if(op==4) { return c/(1.0+max(c.r,max(c.g,c.b))); }
 return c;
}
`;
//# sourceMappingURL=color-grading-shaders.js.map

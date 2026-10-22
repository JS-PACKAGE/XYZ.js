import { Texture, type Texture2DSource } from '../../assets/src/index.js';
import type { Scene } from '../../core/src/scene.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import type { Material2D, PostProcessor2D } from '../../core/src/materials2d/material2d.js';
import { type ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
import type { FrameStats } from './render-stats.js';
import { RenderCommandBuffer2D } from './render2d-contract.js';
import { RenderTexture2D, type RenderTextureOptions2D } from './render-texture2d.js';
import type { NativeResidency, ResidencyAllocation } from './residency.js';
export interface GLTarget2D {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    width: number;
    height: number;
}
export interface GLRender2DHooks {
    owner: object;
    stats: FrameStats;
    residency: NativeResidency;
    anisotropyExtension: EXT_texture_filter_anisotropic | null;
    maxTextureAnisotropy: number;
    createTarget(width: number, height: number): GLTarget2D;
    deleteTarget(target: GLTarget2D): void;
    createProgram(vertex: string, fragment: string, label: string): WebGLProgram;
    source(source: Texture2DSource): WebGLTexture;
    material(effect: Material2D): WebGLProgram;
    processor(effect: PostProcessor2D): WebGLProgram;
    assertIdle(): void;
    assertAlive(): void;
}
/**
 * @internal Vertex source, fragment source and label of each program the constructor
 * creates, in creation order; the renderer starts compiling them before construction.
 */
export declare function render2DProgramSources(): readonly [readonly ["#version 300 es\nprecision highp float;\nuniform vec4 localRect;\nuniform mat3 transform;\nuniform vec2 viewportSize;\nuniform vec4 appearance;\nuniform vec4 uvBasis;\nuniform vec2 uvOrigin;\nuniform vec4 sourceBounds;\nout vec2 vUV;\nout vec2 vLocalUV;\nout vec2 vScreen;\nout float vOpacity;\nout vec4 vSource;\nout vec4 vTint;\nvoid emitVertex(vec2 p, vec2 uv) {\n  vec2 world = (transform * vec3(p, 1.0)).xy;\n  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0, 1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);\n  vUV = uvOrigin + uvBasis.xy * uv.x + uvBasis.zw * uv.y;\n  vLocalUV = uv; vScreen = world; vOpacity = appearance.a;\n  vSource = sourceBounds; vTint = vec4(appearance.rgb, 1.0);\n}\n\nvoid main() {\n  vec2 corners[6] = vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));\n  vec2 uv = corners[gl_VertexID]; emitVertex(localRect.xy + uv * localRect.zw, uv);\n}", string, "2D quad"], readonly ["#version 300 es\nprecision highp float;\nuniform vec4 localRect;\nuniform mat3 transform;\nuniform vec2 viewportSize;\nuniform vec4 appearance;\nuniform vec4 uvBasis;\nuniform vec2 uvOrigin;\nuniform vec4 sourceBounds;\nout vec2 vUV;\nout vec2 vLocalUV;\nout vec2 vScreen;\nout float vOpacity;\nout vec4 vSource;\nout vec4 vTint;\nvoid emitVertex(vec2 p, vec2 uv) {\n  vec2 world = (transform * vec3(p, 1.0)).xy;\n  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0, 1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);\n  vUV = uvOrigin + uvBasis.xy * uv.x + uvBasis.zw * uv.y;\n  vLocalUV = uv; vScreen = world; vOpacity = appearance.a;\n  vSource = sourceBounds; vTint = vec4(appearance.rgb, 1.0);\n}\n\nvoid main() {\n  vec2 corners[6] = vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));\n  vec2 uv = corners[gl_VertexID]; emitVertex(localRect.xy + uv * localRect.zw, uv);\n}", string, "2D normal-map lighting"], readonly ["#version 300 es\nprecision highp float;\nlayout(location=0) in vec2 position;\nlayout(location=1) in vec3 uvq;\nuniform mat3 transform;\nuniform vec2 viewportSize;\nuniform vec4 appearance;\nuniform vec4 uvBasis;\nuniform vec2 uvOrigin;\nuniform vec4 sourceBounds;\nout vec2 vUV;\nout vec2 vLocalUV;\nout vec2 vScreen;\nout float vOpacity;\nout vec4 vSource;\nout vec4 vTint;\nvoid emitVertex(vec2 p, vec2 uv) {\n  vec2 world = (transform * vec3(p, 1.0)).xy;\n  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0, 1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);\n  vUV = uvOrigin + uvBasis.xy * uv.x + uvBasis.zw * uv.y;\n  vLocalUV = uv; vScreen = world; vOpacity = appearance.a;\n  vSource = sourceBounds; vTint = vec4(appearance.rgb, 1.0);\n}\n\nout vec3 vUVQ;\nvoid main() { emitVertex(position, uvq.xy); vUVQ=vec3(uvq.xy*uvq.z,uvq.z); }\n", "#version 300 es\nprecision highp float;\nin vec2 vUV;\nin vec2 vLocalUV;\nin vec2 vScreen;\nin float vOpacity;\nin vec4 vSource;\nin vec4 vTint;\nout vec4 color;\nuniform sampler2D image;\nuniform bool renderSource;\nuniform bool repeatUV;\nuniform vec2 distanceField;\nvec4 sampleSource(vec2 uv) {\n  vec2 halfTexel=min(0.5/vec2(textureSize(image,0)),vSource.zw*0.5);\n  uv=clamp(uv,vSource.xy+halfTexel,vSource.xy+vSource.zw-halfTexel);\n  if(renderSource) uv.y=1.0-uv.y;\n  vec4 c=texture(image,uv);\n  if(distanceField.x>0.0) {\n    float median=max(min(c.r,c.g),min(max(c.r,c.g),c.b));\n    float distance=(distanceField.x>1.5?median:c.r)-0.5;\n    vec2 pixelUV=fwidth(uv)*vec2(textureSize(image,0));\n    float screenRange=max(1.0,distanceField.y/max(max(pixelUV.x,pixelUV.y),0.00001));\n    float coverage=clamp(distance*screenRange+0.5,0.0,1.0);\n    return vec4(vec3(coverage),coverage);\n  }\n  if(!renderSource) c.rgb*=c.a;\n  return c;\n}\n\nin vec3 vUVQ;\nuniform vec2 uvOrigin;\nuniform vec4 uvBasis;\nvoid main(){ vec2 uv=vUVQ.xy/vUVQ.z; if(repeatUV)uv=fract(uv);\n  color=sampleSource(uvOrigin+uvBasis.xy*uv.x+uvBasis.zw*uv.y)*vec4(vTint.rgb*vOpacity,vOpacity);\n}", "indexed 2D mesh"], readonly ["#version 300 es\nprecision highp float;\nlayout(location=0) in vec4 axes;\nlayout(location=1) in vec4 offsetSpace;\nlayout(location=2) in vec4 particleTint;\nlayout(location=3) in vec4 particleRect;\nlayout(location=4) in vec4 particleUV;\nlayout(location=5) in vec4 particleBasis;\nlayout(location=6) in vec4 particleBounds;\nuniform mat3 worldTransform;\nuniform mat3 transform;\nuniform vec2 viewportSize;\nuniform vec4 appearance;\nuniform vec4 uvBasis;\nuniform vec2 uvOrigin;\nuniform vec4 sourceBounds;\nout vec2 vUV;\nout vec2 vLocalUV;\nout vec2 vScreen;\nout float vOpacity;\nout vec4 vSource;\nout vec4 vTint;\nvoid emitVertex(vec2 p, vec2 uv) {\n  vec2 world = (transform * vec3(p, 1.0)).xy;\n  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0, 1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);\n  vUV = uvOrigin + uvBasis.xy * uv.x + uvBasis.zw * uv.y;\n  vLocalUV = uv; vScreen = world; vOpacity = appearance.a;\n  vSource = sourceBounds; vTint = vec4(appearance.rgb, 1.0);\n}\n\nvoid main() {\n  vec2 corners[6] = vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));\n  vec2 uv = corners[gl_VertexID], p = particleRect.xy + uv * particleRect.zw;\n  p = offsetSpace.xy + axes.xy * p.x + axes.zw * p.y;\n  vec2 world = ((offsetSpace.z > 0.5 ? worldTransform : transform) * vec3(p,1.0)).xy;\n  gl_Position = vec4(world.x*2.0/viewportSize.x-1.0,1.0-world.y*2.0/viewportSize.y,0,1);\n  vUV = particleUV.xy + particleBasis.xy*uv.x + particleBasis.zw*uv.y;\n  vLocalUV=uv; vScreen=world; vOpacity=appearance.a*particleTint.a;\n  vTint=vec4(appearance.rgb*particleTint.rgb,1); vSource=particleBounds;\n}", string, "versioned particle layer"], readonly ["#version 300 es\nprecision highp float;\nlayout(location=0) in vec4 axes;\nlayout(location=1) in vec4 offsetSpace;\nlayout(location=2) in vec4 instanceTint;\nlayout(location=3) in vec4 instanceRect;\nlayout(location=4) in vec4 instanceUV;\nlayout(location=5) in vec4 instanceBasis;\nlayout(location=6) in vec4 instanceBounds;\nuniform vec2 viewportSize;\nout vec2 vUV;\nout vec2 vLocalUV;\nout vec2 vScreen;\nout float vOpacity;\nout vec4 vSource;\nout vec4 vTint;\nvoid main() {\n  vec2 corners[6] = vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));\n  vec2 uv=corners[gl_VertexID], p=instanceRect.xy+uv*instanceRect.zw;\n  vec2 world=offsetSpace.xy+axes.xy*p.x+axes.zw*p.y;\n  gl_Position=vec4(world.x*2.0/viewportSize.x-1.0,1.0-world.y*2.0/viewportSize.y,0,1);\n  vUV=instanceUV.xy+instanceBasis.xy*uv.x+instanceBasis.zw*uv.y;\n  vLocalUV=uv; vScreen=world; vOpacity=instanceTint.a;\n  vTint=vec4(instanceTint.rgb,1); vSource=instanceBounds;\n}", string, "2D sprite batch"], readonly ["#version 300 es\nprecision highp float;\nout vec2 vUV;\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0,1);vUV=vec2(p.x,1.0-p.y);}", "#version 300 es\nprecision highp float;\nin vec2 vUV;\nuniform sampler2D image;\nuniform sampler2D mapImage;\nuniform int mode;\nuniform vec2 logicalSize;\nuniform vec4 parameters;\nuniform vec4 rows[5];\nuniform vec2 mapOrigin;\nuniform vec4 mapBasis;\nuniform vec4 mapBounds;\nuniform bool mapRender;\nuniform bool mapRed;\nuniform bool inverseMask;\nout vec4 color;\nvec4 inputAt(vec2 uv){if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return vec4(0);return texture(image,vec2(uv.x,1.0-uv.y));}\nvec4 mapAt(vec2 uv){uv=mapOrigin+mapBasis.xy*uv.x+mapBasis.zw*uv.y;\nvec2 h=min(0.5/vec2(textureSize(mapImage,0)),mapBounds.zw*0.5);uv=clamp(uv,mapBounds.xy+h,mapBounds.xy+mapBounds.zw-h);\nif(mapRender)uv.y=1.0-uv.y;vec4 c=texture(mapImage,uv);if(!mapRender)c.rgb*=c.a;return c;}\nvoid main(){vec4 c=inputAt(vUV);\nif(mode==1)c*=parameters.x;\nelse if(mode==2){vec4 s=c.a>0.0?vec4(c.rgb/c.a,c.a):vec4(0);vec4 r=vec4(dot(rows[0],s),dot(rows[1],s),dot(rows[2],s),dot(rows[3],s))+rows[4];r=clamp(r,0.0,1.0);c=vec4(r.rgb*r.a,r.a);}\nelse if(mode==3){c=vec4(0);float total=0.0;for(int i=-32;i<=32;i++){if(abs(i)>int(parameters.z))continue;float t=float(i)/max(parameters.z,1.0),w=exp(-2.0*t*t);c+=inputAt(vUV+parameters.xy*t/logicalSize)*w;total+=w;}c/=total;}\nelse if(mode==4){float n=fract(sin(dot(vUV*logicalSize,vec2(12.9898,78.233))+parameters.y)*43758.5453)-0.5;c.rgb=clamp(c.rgb+n*parameters.x*c.a,vec3(0),vec3(c.a));}\nelse if(mode==5){vec4 m=mapAt(vUV);vec2 d=(m.a>0.0?m.rg/m.a:vec2(0.5))-0.5;c=inputAt(vUV+d*parameters.xy/logicalSize);}\nelse if(mode==6){vec4 m=mapAt(vUV);float a=mapRed?m.r:m.a;c*=inverseMask?1.0-a:a;}\ncolor=c;}", "local filter and mask"], readonly ["#version 300 es\nprecision highp float;\nuniform vec4 localRect;\nuniform mat3 transform;\nuniform vec2 viewportSize;\nuniform vec4 appearance;\nuniform vec4 uvBasis;\nuniform vec2 uvOrigin;\nuniform vec4 sourceBounds;\nout vec2 vUV;\nout vec2 vLocalUV;\nout vec2 vScreen;\nout float vOpacity;\nout vec4 vSource;\nout vec4 vTint;\nvoid emitVertex(vec2 p, vec2 uv) {\n  vec2 world = (transform * vec3(p, 1.0)).xy;\n  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0, 1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);\n  vUV = uvOrigin + uvBasis.xy * uv.x + uvBasis.zw * uv.y;\n  vLocalUV = uv; vScreen = world; vOpacity = appearance.a;\n  vSource = sourceBounds; vTint = vec4(appearance.rgb, 1.0);\n}\n\nvoid main() {\n  vec2 corners[6] = vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));\n  vec2 uv = corners[gl_VertexID]; emitVertex(localRect.xy + uv * localRect.zw, uv);\n}", "#version 300 es\nprecision highp float;\nin vec2 vUV;\nin vec2 vLocalUV;\nin vec2 vScreen;\nin float vOpacity;\nin vec4 vSource;\nin vec4 vTint;\nout vec4 color;\nuniform sampler2D image;\nuniform bool renderSource;\nuniform bool repeatUV;\nuniform vec2 distanceField;\nvec4 sampleSource(vec2 uv) {\n  vec2 halfTexel=min(0.5/vec2(textureSize(image,0)),vSource.zw*0.5);\n  uv=clamp(uv,vSource.xy+halfTexel,vSource.xy+vSource.zw-halfTexel);\n  if(renderSource) uv.y=1.0-uv.y;\n  vec4 c=texture(image,uv);\n  if(distanceField.x>0.0) {\n    float median=max(min(c.r,c.g),min(max(c.r,c.g),c.b));\n    float distance=(distanceField.x>1.5?median:c.r)-0.5;\n    vec2 pixelUV=fwidth(uv)*vec2(textureSize(image,0));\n    float screenRange=max(1.0,distanceField.y/max(max(pixelUV.x,pixelUV.y),0.00001));\n    float coverage=clamp(distance*screenRange+0.5,0.0,1.0);\n    return vec4(vec3(coverage),coverage);\n  }\n  if(!renderSource) c.rgb*=c.a;\n  return c;\n}\n\nuniform sampler2D backdrop;\nuniform vec2 viewportSize;\nvoid main(){vec4 s=sampleSource(vUV)*vec4(vTint.rgb*vOpacity,vOpacity);vec4 d=texture(backdrop,vec2(vScreen.x/viewportSize.x,1.0-vScreen.y/viewportSize.y));\ncolor=vec4(s.rgb*d.rgb+s.rgb*(1.0-d.a)+d.rgb*(1.0-s.a),s.a+d.a*(1.0-s.a));}", "premultiplied multiply"]];
/** Native local command execution, independent from 3D and immutable frame capture. */
export declare class WebGLRender2D {
    private readonly gl;
    private readonly hooks;
    private readonly quad;
    private readonly sourceQuad;
    private readonly appearance;
    private readonly matrix;
    private readonly mapping;
    private readonly tileMatrix;
    private readonly inverse;
    private readonly programs;
    private readonly layers;
    private readonly maskCanvas;
    /** Counts `draw` calls; layers record the last one that used them. */
    private frame;
    private readonly targets;
    private readonly meshes;
    private readonly particles;
    private readonly captureCommands;
    private readonly emptyVAO;
    private readonly quadProgram;
    private readonly lightingProgram;
    private readonly lightingData;
    private readonly uploadedLighting;
    private readonly litMaterials;
    private readonly meshProgram;
    private readonly particleProgram;
    private readonly passProgram;
    private readonly spriteProgram;
    private readonly spriteVAO;
    private readonly spriteBuffer;
    private spriteData;
    private spriteCapacity;
    private readonly blendProgram;
    private readonly matrixRows;
    private readonly dependencies;
    private readonly samplers;
    private resolution;
    private viewportWidth;
    private viewportHeight;
    private disposed;
    constructor(gl: WebGL2RenderingContext, hooks: GLRender2DHooks);
    private register;
    private litProgram;
    private uniform;
    preflight(commands: RenderCommandBuffer2D, scene: Scene, width: number, height: number, resolution: number): void;
    private validateSource;
    private validateCommands;
    private validateBounds;
    draw(commands: RenderCommandBuffer2D, scene: Scene, target: GLTarget2D, width: number, height: number): void;
    private bindTarget;
    private objectMatrix;
    private useQuad;
    private distanceField;
    private sampler;
    private drawCommands;
    private bindInstances;
    private packQuad;
    private spriteMatrix;
    /**
     * `continuing`: the previous command was a batch drawn here in the same context, so the
     * program, its per-context uniforms, unit 0, the VAO and the instance buffer are still set.
     */
    private drawSprites;
    private drawSprite;
    prepareGeometry(geometry: Geometry2D): ResidencyAllocation;
    unloadGeometry(geometry: Geometry2D): void;
    private drawMesh;
    prepareParticles(layer: ParticleLayer2D): ResidencyAllocation;
    private drawParticles;
    private layer;
    private clear;
    private drawLayer;
    private compositeLayer;
    private drawMask;
    private pass;
    createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D;
    source(texture: RenderTexture2D): WebGLTexture;
    renderToTexture(target: RenderTexture2D, content: Scene | IsolatedGroup2D, options?: {
        clear?: boolean;
        bounds?: Rect2D;
    }): Promise<void>;
    private drawSceneEffects;
    extractPixels(target: RenderTexture2D, options?: {
        region?: Rect2D;
    }): Promise<Uint8ClampedArray>;
    generateTexture(content: Scene | IsolatedGroup2D, options?: {
        bounds?: Rect2D;
        resolution?: number;
    }): Promise<Texture>;
    destroy(): void;
}

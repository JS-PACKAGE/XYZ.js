import { afterEach, describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { Scene } from '../packages/core/src/scene.js';
import { PointLight, SpotLight } from '../packages/core/src/lights.js';
import { EnvironmentMap } from '../packages/core/src/environment.js';
import { bakeLightmap, bakeIrradianceVolume, BakedIrradianceVolume, bindIrradianceVolume, fillMeshIrradiance } from '../packages/core/src/baked-lighting.js';
import { BakeBVH } from '../packages/core/src/bake-bvh.js';

function mesh(z = 0): Mesh {
  return new Mesh({ geometry: new Geometry({ positions: [-1,-1,z, 1,-1,z, -1,1,z], normals: [0,0,1, 0,0,1, 0,0,1], uvs: [0,0,1,0,0,1], uvs1: [0.1,0.1,0.9,0.1,0.1,0.9], indices: [0,1,2] }), material: new TextureMaterial({ texture: new Texture({width:1,height:1,close() {}} as ImageBitmap) }) });
}
function scene(): Scene { const s = new Scene(); s.ambientLight = 0; s.directionalLight.direction.set(0,0,1); s.directionalLight.intensity = 0.5; return s; }
function imageGlobals(): void {
  vi.stubGlobal('ImageData', class { constructor(readonly data: Uint8ClampedArray, readonly width: number, readonly height: number) {} });
  vi.stubGlobal('createImageBitmap', async (image: {width:number;height:number}) => ({width:image.width,height:image.height,close() {}}));
}
afterEach(() => vi.unstubAllGlobals());
describe('bounded baked lighting', () => {
  it('BVH returns nearest transformed triangles and enforces ray quotas', () => {
    const a = mesh(), b = mesh(); b.transform.position.z = 2;
    const tree = new BakeBVH([a,b], 2, 1);
    const hit = tree.hit([-0.5,-0.5,3], [0,0,-1], 10);
    expect(hit?.triangle.mesh).toBe(b); expect(hit?.distance).toBeCloseTo(1);
    expect(() => tree.hit([0,0,3], [0,0,-1], 10)).toThrow(/ray budget/);
    expect(() => new BakeBVH([a,b], 1, 10)).toThrow(/triangle budget/);
  });
  it('bakes sun visibility into generated UV1 without mutating receivers', async () => {
    imageGlobals(); const s = scene(), receiver = mesh(), blocker = mesh(1);
    const before = receiver.geometry.uvs1!.slice();
    const lit = await bakeLightmap(s, {meshes:[receiver],size:16,padding:1,samples:4});
    const dark = await bakeLightmap(s, {meshes:[receiver,blocker],size:32,padding:1,samples:4});
    expect(Math.max(...lit.pixels)).toBeCloseTo(0.5);
    expect(lit.geometries.get(receiver)).not.toBe(receiver.geometry);
    expect(receiver.geometry.uvs1).toEqual(before);
    expect(dark.rays).toBeGreaterThan(0);
    expect(lit.materialOptions.textureCoordinates?.emissive?.texCoord).toBe(1);
    lit.destroy(); expect(lit.texture.destroyed).toBe(true); dark.destroy();
  });
  it('point and spot contributions obey range and cone', async () => {
    imageGlobals(); const s = scene(); s.directionalLight.intensity = 0; const receiver = mesh();
    s.pointLights.push(new PointLight({position:[0,0,2],intensity:1,range:5}));
    const lit = await bakeLightmap(s, {meshes:[receiver],size:16,padding:1,samples:1});
    expect(Math.max(...lit.pixels)).toBeGreaterThan(0.1);
    s.pointLights.length = 0; s.spotLights.push(new SpotLight({position:[0,0,2],direction:[0,0,1],intensity:1}));
    const dark = await bakeLightmap(s, {meshes:[receiver],size:16,padding:1,samples:1});
    expect(Math.max(...dark.pixels)).toBe(0);
  });
  it('AO occludes ambient under a covering triangle', async () => {
    imageGlobals(); const s = scene(); s.directionalLight.intensity = 0; s.ambientLight = 1;
    const receiver = mesh(), blocker = mesh(0.05); blocker.transform.scale.set(20,20,1);
    const result = await bakeLightmap(s, {meshes:[receiver,blocker],size:32,padding:1,samples:32});
    expect(result.pixels.some(v => v < 0.5)).toBe(true);
    expect(result.pixels.some(v => v > 0.9)).toBe(true);
  });
  it('rejects missing authored UV1, overlapping charts and insufficient atlas area', async () => {
    const s = scene(), a = mesh(), b = mesh(2);
    await expect(bakeLightmap(s,{meshes:[a,b],atlas:'uv1',size:32,padding:1})).rejects.toThrow(/Overlapping/);
    await expect(bakeLightmap(s,{meshes:[a],size:4,padding:2})).rejects.toThrow(/too small/);
    await expect(bakeLightmap(s,{meshes:[a],size:16,maxRays:1})).rejects.toThrow(/ray budget/);
    await expect(bakeLightmap(s,{meshes:[a],samples:513})).rejects.toThrow(/Samples/);
  });
  it('dilates coverage into padded chart pixels', async () => {
    imageGlobals(); const result = await bakeLightmap(scene(),{meshes:[mesh()],size:16,padding:2,samples:1});
    expect(result.pixels[(1*16+1)*3]).toBeCloseTo(0.5);
  });
  it('interpolates all eight probe corners in L1 and clears outside/destroyed output', () => {
    const data = new Float32Array(8*12);
    for (let i=0;i<8;i++) data[i*12] = i;
    const volume = new BakedIrradianceVolume({min:[0,0,0],max:[1,1,1],resolution:[2,2,2],order:1},data);
    const out = new Float32Array(36); expect(volume.sampleSH(0.5,0.5,0.5,out)).toBe(true); expect(out[0]).toBeCloseTo(3.5); expect(out[16]).toBe(0);
    expect(volume.sampleSH(1,1,1,out)).toBe(true); expect(out[0]).toBe(7);
    expect(volume.sampleSH(2,1,1,out)).toBe(false); expect(out.every(v=>v===0)).toBe(true);
    volume.destroy(); expect(volume.sampleSH(0,0,0,out)).toBe(false);
  });
  it('environment-only L2 bake preserves constant diffuse irradiance', () => {
    const env = EnvironmentMap.fromPixels(16,8,new Float32Array(16*8*3).fill(0.4));
    const volume = bakeIrradianceVolume(env,{min:[0,0,0],max:[1,1,1],resolution:[2,2,2],samples:256});
    const out = new Float32Array(36); volume.sampleSH(0.5,0.5,0.5,out);
    expect(out[0]*0.282095).toBeCloseTo(0.4,2); expect(Math.abs(out[4])).toBeLessThan(0.01);
    env.destroy();
  });
  it('runtime binding follows moving mesh position without allocations in output', () => {
    const data = new Float32Array(8*12); for(let i=0;i<8;i++) data[i*12]=i;
    const v = new BakedIrradianceVolume({min:[0,0,0],max:[1,1,1],resolution:[2,2,2],order:1},data), m = mesh(), out = new Float32Array(40);
    bindIrradianceVolume(m,v); fillMeshIrradiance(m,out); expect(out[36]).toBe(1); expect(out[0]).toBe(0);
    m.transform.position.set(1,1,1); fillMeshIrradiance(m,out); expect(out[0]).toBe(7);
    bindIrradianceVolume(m,undefined); fillMeshIrradiance(m,out); expect(out.every(n=>n===0)).toBe(true);
  });
  it('rejects oversized grids and malformed SH memory', () => {
    expect(()=>new BakedIrradianceVolume({min:[0,0,0],max:[1,1,1],resolution:[100,100,100]})).toThrow(/memory/);
    expect(()=>new BakedIrradianceVolume({min:[0,0,0],max:[1,1,1]},[NaN])).toThrow(/coefficients/);
  });
});

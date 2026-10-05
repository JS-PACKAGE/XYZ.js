import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { NativeMaterial3D } from '../packages/core/src/native-material3d.js';
import { NativePBRMaterial } from '../packages/core/src/native-pbr-material.js';
import { Scene } from '../packages/core/src/scene.js';
import { ShadowAtlas } from '../packages/core/src/shadow-atlas.js';
import { ShadowCache } from '../packages/graphics/src/shadow-cache.js';
import { ShadowSettings } from '../packages/core/src/render-settings.js';

function fixture(native = false, tracked = false) {
  const texture = new Texture({
    width: 1,
    height: 1,
    close() {},
  } as ImageBitmap);
  const scene = new Scene();
  scene.shadows.enabled = true;
  const material = native
    ? new NativeMaterial3D({
        texture,
        wgsl: 'hooks',
        glsl: 'hooks',
        shadowCache: tracked ? 'tracked' : 'dynamic',
      })
    : new TextureMaterial({ texture });
  const group = scene.add(new Group());
  const mesh = group.add(new Mesh({ geometry: Geometry.cube(), material }));
  const cache = new ShadowCache(),
    atlas = new ShadowAtlas();
  const entries = new Map([
    [
      mesh,
      {
        mesh,
        sphere: { x: 0, y: 0, z: 0, radius: 1 },
        fade: 1,
        instances: undefined,
      },
    ],
  ]);
  const draw = (width = 320, casters: Mesh[] = [mesh]) => {
    mesh.updateRenderDeformation();
    mesh.updateWorldMatrix();
    atlas.update(scene, 1);
    const dirty = cache.needsRender(scene, atlas, casters, entries, width, 240);
    cache.commit();
    return dirty;
  };
  return { scene, mesh, group, material, draw, cache, entries };
}

describe('native shadow atlas reuse', () => {
  it('invalidates raw ancestor poses, light motion, geometry, LOD coverage and caster membership', () => {
    const f = fixture();
    expect(f.draw()).toBe(true);
    expect(f.draw()).toBe(false);
    f.group.position.x += 1;
    expect(f.draw()).toBe(true);
    expect(f.draw()).toBe(false);
    f.scene.directionalLight.direction.x += 0.3;
    expect(f.draw()).toBe(true);
    f.mesh.geometry.markUpdated();
    expect(f.draw()).toBe(true);
    f.entries.get(f.mesh)!.fade = 0.5;
    expect(f.draw()).toBe(true);
    expect(f.draw(320, [])).toBe(true);
    expect(f.draw()).toBe(true);
  });

  it('invalidates resize, scene replacement, explicit invalidation and recreated/lost native targets', () => {
    const f = fixture();
    f.draw();
    expect(f.draw()).toBe(false);
    expect(f.draw(640)).toBe(true);
    f.scene.shadows.invalidate();
    expect(f.draw(640)).toBe(true);
    f.cache.invalidate();
    expect(f.draw(640)).toBe(true);
    f.scene.shadows.cache = false;
    expect(f.draw(640)).toBe(true);
    expect(f.draw(640)).toBe(true);
  });

  it('falls back for untracked native hooks and reads directly mutated tracked uniforms', () => {
    const dynamic = fixture(true);
    dynamic.draw();
    expect(dynamic.draw()).toBe(true);
    const tracked = fixture(true, true);
    tracked.draw();
    expect(tracked.draw()).toBe(false);
    (tracked.material as NativeMaterial3D).uniforms[0] = 3;
    expect(tracked.draw()).toBe(true);
    expect(tracked.draw()).toBe(false);
    (tracked.material as NativeMaterial3D).uniforms[0] = NaN;
    expect(() => tracked.draw()).toThrow(RangeError);
  });

  it('reads directly mutated tracked physical uniforms', () => {
    const texture = new Texture({
      width: 1,
      height: 1,
      close() {},
    } as ImageBitmap);
    const scene = new Scene();
    scene.shadows.enabled = true;
    const material = new NativePBRMaterial({
      texture,
      wgsl: 'fn xyzPhysical(w:vec3f,n:vec3f,uv:vec2f,s:XYZPhysical)->XYZPhysical { return s; }',
      glsl: 'XYZPhysical xyzPhysical(vec3 w,vec3 n,vec2 uv,XYZPhysical s) { return s; }',
      shadowCache: 'tracked',
    });
    const mesh = scene.add(new Mesh({ geometry: Geometry.cube(), material }));
    const cache = new ShadowCache();
    const atlas = new ShadowAtlas();
    const entries = new Map([
      [
        mesh,
        {
          mesh,
          sphere: { x: 0, y: 0, z: 0, radius: 1 },
          fade: 1,
          instances: undefined,
        },
      ],
    ]);
    const draw = () => {
      mesh.updateRenderDeformation();
      mesh.updateWorldMatrix();
      atlas.update(scene, 1);
      const dirty = cache.needsRender(scene, atlas, [mesh], entries, 320, 240);
      cache.commit();
      return dirty;
    };
    expect(draw()).toBe(true);
    expect(draw()).toBe(false);
    material.uniforms[0] = 4;
    expect(draw()).toBe(true);
    expect(draw()).toBe(false);
    material.destroy();
    texture.destroy();
  });

  it('rejects invalid quality controls without clamping author input', () => {
    expect(() => new ShadowSettings({ cascadeBlend: 0.51 })).toThrow(
      RangeError,
    );
    expect(() => new ShadowSettings({ slopeBias: -1 })).toThrow(RangeError);
    expect(
      () => new ShadowSettings({ cache: 'yes' as unknown as boolean }),
    ).toThrow(TypeError);
  });
});

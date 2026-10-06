import {
  createRenderer,
  EnvironmentMap,
  Geometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MorphTargets,
  MorphWeights,
  NativePBRMaterial,
  Object3D,
  OrthographicCamera,
  PBRMaterial,
  ReflectionProbe,
  Scene,
  SkinnedMesh,
  Texture,
  Vector3,
  setMeshMaterial,
  type PBRMaterialOptions,
  type RendererPreference,
} from '../../src/index.js';
import { frameProofs } from './frame-proof.js';
import {
  buildMeshFragment,
  buildMeshVertex,
  meshFragment,
  meshVertex,
} from '../../packages/graphics/src/webgl-feature-shaders.js';
import { meshShaderFeatures } from '../../packages/graphics/src/mesh-shader-variants.js';

const output = document.querySelector<HTMLPreElement>('#report')!;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const preference = new URLSearchParams(location.search).get(
  'renderer',
) as RendererPreference;
const report = {
  renderer: preference,
  scenarios: [] as {
    name: string;
    differentBytes: number;
    maximumDifference: number;
    oracle?:
      'ordinary-repeat-with-external-full-reference' | 'native-full-repeat';
    changedPixels?: number;
    pixels: number[];
  }[],
  compilation: [] as {
    name: string;
    fragmentBytes: number;
    compileLinkMs: number;
  }[],
  error: undefined as string | undefined,
};

async function run(): Promise<void> {
  const renderer = await createRenderer(
    canvas,
    preference,
    (error) => {
      throw error;
    },
    { antialias: false },
  );
  if (renderer.backend !== preference)
    throw new Error('Forced backend changed.');
  renderer.resize(128, 128);
  const proofs = frameProofs(renderer, canvas);
  const image = document.createElement('canvas');
  image.width = image.height = 16;
  const context = image.getContext('2d')!;
  context.fillStyle = '#b79059';
  context.fillRect(0, 0, 16, 16);
  context.fillStyle = '#3866ad';
  context.fillRect(0, 0, 8, 8);
  const texture = await Texture.fromImage(image);
  context.fillStyle = 'rgb(160,110,245)';
  context.fillRect(0, 0, 16, 16);
  const normal = await Texture.fromImage(image);
  const geometry = Geometry.sphere(0.9, 24, 16);
  const environment = EnvironmentMap.gradient({
    width: 32,
    zenith: [0.2, 0.5, 1],
    horizon: [0.6, 0.3, 0.15],
    ground: [0.1, 0.04, 0.01],
  });
  const draw = async (scene: Scene) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const proof = proofs.next();
    renderer.beginFrame();
    renderer.render(scene, 128, 128);
    renderer.endFrame();
    return proof;
  };
  try {
    for (const name of [
      'plain-lights',
      'normal-mapped',
      'ibl-gradient',
      'clearcoat',
      'sheen',
      'anisotropy',
      'iridescence',
      'subsurface',
      'dispersion',
      'finish',
      'finish-height',
      'finish-weathering',
      'finish-detail',
      'finish-triplanar',
      'lightmap',
      'reflection-probes',
      'transparent-blend',
      'instancing',
      'skinned-four-mirrored-nonuniform',
      'skinned-eight-mirrored-nonuniform',
      'morph',
      'skinned-morph',
      'shadowed-ground',
      'full-feature',
      'native-custom-surface',
      'native-custom-deform',
      'native-custom-instance',
    ]) {
      const scene = new Scene();
      const native: NativePBRMaterial[] = [];
      try {
        const camera = new OrthographicCamera();
        camera.height = 3.6;
        camera.position.set(2.5, 1.8, 5);
        camera.lookAt(new Vector3());
        scene.camera3D = camera;
        scene.ambientLight = 0.12;
        scene.directionalLight.direction.set(0.3, 0.8, 1).normalize();
        if (
          name === 'ibl-gradient' ||
          name === 'full-feature' ||
          name === 'dispersion'
        )
          scene.environment = environment;
        const full = name === 'full-feature';
        const custom = name.startsWith('native-custom-');
        if (name === 'reflection-probes')
          scene.reflectionProbes.push(
            new ReflectionProbe({
              environment,
              position: [0, 0, 0],
              min: [-3, -3, -3],
              max: [3, 3, 3],
              blendDistance: 1,
            }),
          );
        const options: PBRMaterialOptions = {
          texture,
          normalTexture:
            full || name === 'normal-mapped' || name === 'finish-height'
              ? normal
              : undefined,
          lightmap: full || name === 'lightmap' ? texture : undefined,
          roughness: 0.35,
          metallic: 0.2,
          alphaMode: name === 'transparent-blend' ? 'BLEND' : 'OPAQUE',
          opacity: name === 'transparent-blend' ? 0.45 : 1,
          clearcoat: full || name === 'clearcoat' ? 0.6 : 0,
          sheenColor: full || name === 'sheen' ? [0.4, 0.1, 0.2] : [0, 0, 0],
          transmission: full || name === 'dispersion' ? 0.5 : 0,
          thickness: 0.2,
          finish: {
            anisotropy: full || name === 'anisotropy' ? 0.6 : 0,
            iridescence: full || name === 'iridescence' ? 0.7 : 0,
            iridescenceThickness: 0.4,
            subsurface: full || name === 'subsurface' ? 0.5 : 0,
            dispersion: full || name === 'dispersion' ? 0.5 : 0,
            heightScale: full || name === 'finish-height' ? 0.15 : 0,
            wetness:
              full || name === 'finish' || name === 'finish-weathering'
                ? 0.2
                : 0,
            snow: full || name === 'finish-weathering' ? 0.2 : 0,
            dirt: full || name === 'finish-weathering' ? 0.2 : 0,
            damage: full || name === 'finish-weathering' ? 0.2 : 0,
            detailStrength:
              full || name === 'finish' || name === 'finish-detail' ? 0.4 : 0,
            layerBlend: full || name === 'finish-detail' ? 0.5 : 0,
            triplanar:
              full || name === 'finish' || name === 'finish-triplanar'
                ? 0.3
                : 0,
            lightmapStrength: full || name === 'lightmap' ? 0.6 : 0,
          },
        };
        const material = new PBRMaterial(options);
        const hasMorph = name === 'morph' || name === 'skinned-morph';
        const vertices = geometry.vertices.length / 8;
        const positions = new Float32Array(vertices * 3);
        const normals = new Float32Array(vertices * 3);
        if (hasMorph)
          for (let i = 0; i < vertices; i++) {
            positions[i * 3] = geometry.vertices[i * 8 + 1]! * 0.25;
            positions[i * 3 + 1] = geometry.vertices[i * 8]! * 0.15;
            positions[i * 3 + 2] = 0.12;
            normals[i * 3] = 0.1;
            normals[i * 3 + 1] = -0.08;
          }
        const morph = hasMorph
          ? new MorphTargets({
              positions: [positions],
              normals: [normals],
              weights: new MorphWeights([0.7]),
            })
          : undefined;
        let mesh: Mesh;
        if (name.startsWith('skinned-')) {
          const influencesPerVertex = name.includes('eight') ? 8 : 4;
          const joints = Array.from({ length: influencesPerVertex }, (_, i) => {
            const joint = scene.add(new Object3D());
            joint.position.set((i - 1) * 0.04, i * 0.02, i * 0.01);
            joint.rotation.setFromEuler(0.03 * i, -0.04 * i, 0.05 * i);
            joint.scale.set(i === 0 ? -1.1 : 0.8 + i * 0.04, 1.2, 0.85);
            return joint;
          });
          const jointIndices = new Uint32Array(vertices * influencesPerVertex);
          const weights = new Float32Array(jointIndices.length);
          for (let v = 0; v < vertices; v++)
            for (let i = 0; i < influencesPerVertex; i++) {
              jointIndices[v * influencesPerVertex + i] = i;
              weights[v * influencesPerVertex + i] =
                i === 0 ? 0.7 : 0.3 / (influencesPerVertex - 1);
            }
          mesh = new SkinnedMesh({
            geometry,
            material,
            morph,
            joints,
            inverseBindMatrices: joints.map(() => new Matrix4()),
            jointIndices,
            weights,
            influencesPerVertex,
          });
        } else if (name === 'instancing' || name === 'native-custom-instance') {
          const instances = new InstancedMesh({ geometry, material, count: 2 });
          const first = new Matrix4();
          first.elements[12] = -0.65;
          first.elements[13] = 0.25;
          const second = new Matrix4();
          second.elements[0] = 0.75;
          second.elements[5] = 1.15;
          second.elements[12] = 0.65;
          second.elements[13] = -0.25;
          second.elements[14] = -0.4;
          instances.setMatrixAt(0, first);
          instances.setMatrixAt(1, second);
          mesh = instances;
        } else mesh = new Mesh({ geometry, material, morph });
        scene.add(mesh);
        const compared = [{ mesh, options }];
        if (name === 'shadowed-ground') {
          const groundOptions: PBRMaterialOptions = {
            texture,
            roughness: 0.9,
            alphaMode: 'OPAQUE',
          };
          const ground = scene.add(
            new Mesh({
              geometry: Geometry.cube(),
              material: new PBRMaterial(groundOptions),
            }),
          );
          ground.position.set(0, -1, 0);
          ground.scale.set(4, 0.1, 4);
          compared.push({ mesh: ground, options: groundOptions });
          Object.assign(scene.shadows, {
            enabled: true,
            cache: false,
            mapSize: 128,
            extent: 5,
            far: 20,
          });
        }
        await draw(scene);
        const baseline = await draw(scene);
        if (name === 'shadowed-ground') {
          scene.shadows.enabled = false;
          await draw(scene);
          const unshadowed = await draw(scene);
          let shadowPixels = 0;
          for (let i = 0; i < baseline.bytes.length; i += 4)
            if (
              baseline.bytes[i]! < unshadowed.bytes[i]! ||
              baseline.bytes[i + 1]! < unshadowed.bytes[i + 1]! ||
              baseline.bytes[i + 2]! < unshadowed.bytes[i + 2]!
            )
              shadowPixels++;
          if (shadowPixels <= 50)
            throw new Error(
              `${name}: ground did not receive a rendered shadow.`,
            );
          scene.shadows.enabled = true;
          await draw(scene);
        }
        const identityWGSL =
          'fn xyzPhysical(w:vec3f,n:vec3f,uv:vec2f,s:XYZPhysical)->XYZPhysical { return s; }';
        const identityGLSL =
          'XYZPhysical xyzPhysical(vec3 w,vec3 n,vec2 uv,XYZPhysical s) { return s; }';
        const hooks = {
          wgsl:
            name === 'native-custom-surface'
              ? 'fn xyzPhysical(w:vec3f,n:vec3f,uv:vec2f,s:XYZPhysical)->XYZPhysical { var out=s; out.base=vec3f(1.0,0.02,0.02); return out; }'
              : identityWGSL,
          glsl:
            name === 'native-custom-surface'
              ? '#if defined(XYZ_FRAGMENT) && !defined(XYZ_SHADOW)\nXYZPhysical xyzPhysical(vec3 w,vec3 n,vec2 uv,XYZPhysical s) { XYZPhysical outv=s; outv.base=vec3(1.0,0.02,0.02); return outv; }\n#endif'
              : identityGLSL,
        };
        if (name === 'native-custom-deform') {
          hooks.wgsl +=
            ' fn xyzDeform(p:vec3f,n:vec3f,uv:vec2f)->XYZVertex { return XYZVertex(p+vec3f(0.45,0.0,0.0),n); }';
          hooks.glsl +=
            '\nXYZVertex xyzDeform(vec3 p,vec3 n,vec2 uv) { return XYZVertex(p+vec3(0.45,0,0),n); }';
        }
        if (name === 'native-custom-instance') {
          hooks.wgsl +=
            ' fn xyzDeformInstance(p:vec3f,n:vec3f,uv:vec2f,m:mat4x4f)->XYZVertex { return XYZVertex(p+vec3f(0.0,m[3].x*0.6,0.0),n); }';
          hooks.glsl +=
            '\nXYZVertex xyzDeformInstance(vec3 p,vec3 n,vec2 uv,mat4 m) { return XYZVertex(p+vec3(0,m[3].x*0.6,0),n); }';
        }
        const useFull = async () => {
          if (!renderer.prepareNativePBRMaterial)
            throw new Error('Missing native physical preparation.');
          for (const target of compared) {
            const reference = new NativePBRMaterial({
              ...target.options,
              deformationBounds: custom ? 1 : 0,
              ...hooks,
            });
            native.push(reference);
            await renderer.prepareNativePBRMaterial(reference);
            setMeshMaterial(target.mesh, reference);
          }
          await draw(scene);
          return draw(scene);
        };
        // Custom native hooks already use conservative full source. A fresh full
        // preparation is the oracle; baseline deltas below prove the hook draws.
        const optimized = custom ? await useFull() : baseline;
        const original = custom ? await useFull() : await draw(scene);
        let changedPixels = 0;
        if (custom) {
          let redPixels = 0;
          for (let i = 0; i < optimized.bytes.length; i += 4) {
            if (
              optimized.bytes[i] !== baseline.bytes[i] ||
              optimized.bytes[i + 1] !== baseline.bytes[i + 1] ||
              optimized.bytes[i + 2] !== baseline.bytes[i + 2]
            )
              changedPixels++;
            if (
              optimized.bytes[i]! > 80 &&
              optimized.bytes[i]! > optimized.bytes[i + 1]! + 30 &&
              optimized.bytes[i]! > optimized.bytes[i + 2]! + 30
            )
              redPixels++;
          }
          if (changedPixels <= 50)
            throw new Error(
              `${name}: custom hook did not change rendered pixels.`,
            );
          if (name === 'native-custom-surface' && redPixels <= 50)
            throw new Error(
              `${name}: physical hook did not render a red surface.`,
            );
        }
        let differentBytes = 0;
        let maximumDifference = 0;
        for (let i = 0; i < optimized.bytes.length; i++) {
          const difference = Math.abs(optimized.bytes[i]! - original.bytes[i]!);
          if (difference) differentBytes++;
          maximumDifference = Math.max(maximumDifference, difference);
        }
        report.scenarios.push({
          name,
          differentBytes,
          maximumDifference,
          oracle: custom
            ? 'native-full-repeat'
            : 'ordinary-repeat-with-external-full-reference',
          pixels: Array.from(optimized.bytes),
          ...(custom ? { changedPixels } : {}),
        });
        if (differentBytes)
          throw new Error(
            `${name}: ${differentBytes} bytes differ from full reference shader (maximum ${maximumDifference}).`,
          );
        if (preference === 'webgl2' && (name === 'plain-lights' || full)) {
          const gl = document.createElement('canvas').getContext('webgl2')!;
          const features = meshShaderFeatures(material, mesh, scene);
          const fragmentSource = full
            ? meshFragment
            : buildMeshFragment(features);
          const vertexSource = full ? meshVertex : buildMeshVertex();
          const start = performance.now();
          const shaders = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].map(
            (stage, i) => {
              const shader = gl.createShader(stage)!;
              gl.shaderSource(shader, i === 0 ? vertexSource : fragmentSource);
              gl.compileShader(shader);
              return shader;
            },
          );
          const program = gl.createProgram()!;
          for (const shader of shaders) gl.attachShader(program, shader);
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(
              gl.getProgramInfoLog(program) ?? 'Timing shader failed.',
            );
          report.compilation.push({
            name,
            fragmentBytes: new TextEncoder().encode(fragmentSource).length,
            compileLinkMs: performance.now() - start,
          });
          for (const shader of shaders) gl.deleteShader(shader);
          gl.deleteProgram(program);
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } finally {
        scene.destroy();
        for (const material of native) material.destroy();
      }
    }
  } finally {
    renderer.destroy();
    texture.destroy();
    normal.destroy();
    environment.destroy();
  }
}
void run()
  .then(() => {
    output.textContent = JSON.stringify(report);
    output.dataset.state = 'passed';
  })
  .catch((error: unknown) => {
    report.error = String(error);
    output.textContent = JSON.stringify(report);
    output.dataset.state = 'failed';
  });

/* global document, requestAnimationFrame -- used inside page.evaluate, which runs in the browser */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
const directory = resolve(process.argv[2] ?? '.vite/physics-expansion-runtime');
await mkdir(directory, { recursive: true });
const server = await createServer({
  configFile: false,
  server: { host: '127.0.0.1', port: 5247, strictPort: true },
  plugins: [
    {
      name: 'physics-runtime',
      configureServer(server) {
        server.middlewares.use('/physics-runtime', (_req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end('<!doctype html><html><body></body></html>');
        });
      },
    },
  ],
});
let browser;
const report = { consumer: 'public source root', results: [], errors: [] };
try {
  await server.listen();
  const launch = await browserLaunchOptions('chromium');
  browser = await chromium.launch(launch);
  report.browser = browserIdentity('chromium', browser, launch);
  for (const backend of ['webgl2', 'webgpu']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await page.goto('http://127.0.0.1:5247/physics-runtime');
    try {
      const result = await page.evaluate(async (backend) => {
        const E = await import('/src/index.ts');
        const { frameProofs } = await import('/tests/browser/frame-proof.ts');
        const canvas = document.createElement('canvas');
        document.body.replaceChildren(canvas);
        const renderer = await E.createRenderer(canvas, backend);
        renderer.resize(320, 240);
        const proofs = frameProofs(renderer, canvas),
          scenarios = [];
        const check = (value, message) => {
          if (!value) throw new Error(message);
        };
        const image = document.createElement('canvas');
        image.width = image.height = 4;
        const context = image.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, 4, 4);
        const texture = await E.Texture.fromImage(image);
        const material = (color) => new E.TextureMaterial({ texture, color });
        const colors = {
          body: material([0.1, 0.65, 0.95]),
          cloth: material([0.95, 0.45, 0.1]),
          debug: material([0.2, 1, 0.3]),
          contact: material([1, 0.1, 0.2]),
          joint: material([1, 1, 0]),
        };
        const scene = () => {
          const scene = new E.Scene();
          scene.ambientLight = 1;
          scene.directionalLight.intensity = 0;
          scene.camera3D.position.set(5, 4, 8);
          scene.camera3D.lookAt(new E.Vector3(0, 0.7, 0));
          return scene;
        };
        const floor = (scene) => {
          const object = scene.add(
            new E.Mesh({
              geometry: E.Geometry.cube(1),
              material: material([0.12, 0.12, 0.15]),
              position: [0, -0.08, 0],
              scale: [12, 0.1, 12],
            }),
          );
          object.collider = new E.PlaneCollider3D();
          return object;
        };
        const dynamic = (scene, y, box = false) => {
          const object = scene.add(new E.Object3D());
          object.position.y = y;
          object.collider = box
            ? new E.BoxCollider3D(new E.Vector3(0.6, 0.1, 1))
            : new E.SphereCollider3D(0.12);
          object.body = new E.RigidBody3D({ allowSleep: false });
          return object;
        };
        const debug = (scene) =>
          scene.add(
            new E.PhysicsDebugDraw3D(scene.physics3D, {
              colliderMaterial: colors.debug,
              jointMaterial: colors.joint,
              contactMaterial: colors.contact,
              width: 0.025,
            }),
          );
        const tick = (scene, count) => {
          for (let i = 0; i < count; i++)
            scene.advanceAfterUpdate(scene.fixedDelta, () => true);
        };
        const draw = async (scene) => {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          scene.updateCameraDependents(canvas.height);
          renderer.beginFrame();
          renderer.render(scene, canvas.width, canvas.height);
          const pending = proofs.next();
          renderer.endFrame();
          return pending;
        };
        const difference = (a, b) => {
          let changed = 0;
          for (let i = 0; i < a.bytes.length; i += 4)
            if (
              Math.abs(a.bytes[i] - b.bytes[i]) +
                Math.abs(a.bytes[i + 1] - b.bytes[i + 1]) +
                Math.abs(a.bytes[i + 2] - b.bytes[i + 2]) >
              15
            )
              changed++;
          return changed;
        };
        const scenario = async (name, run) => {
          try {
            scenarios.push({ name, passed: true, ...(await run()) });
          } catch (error) {
            scenarios.push({
              name,
              passed: false,
              error: error.stack ?? String(error),
            });
          }
        };
        try {
          await scenario(
            'vehicle-fixed-scene-suspension-drive-brake-steer',
            async () => {
              const s = scene();
              floor(s);
              const chassis = dynamic(s, 0.8, true);
              chassis.body.mass = 400;
              const visual = chassis.add(
                new E.Mesh({
                  geometry: E.Geometry.cube(1),
                  material: colors.body,
                  scale: [1.2, 0.2, 2],
                }),
              );
              const vehicle = new E.Vehicle3D(s.physics3D, {
                chassis,
                driveForce: 1600,
                brakeForce: 4000,
                wheels: [-1, 1].flatMap((x) =>
                  [-1, 1].map((z) => ({
                    position: new E.Vector3(x * 0.5, 0, z * 0.8),
                    radius: 0.2,
                    restLength: 0.6,
                    spring: 20000,
                    damping: 2500,
                    drive: true,
                    steer: z > 0,
                  })),
                ),
              });
              const d = debug(s);
              s.fixedUpdate = (dt) => vehicle.update(dt);
              try {
                d.refresh();
                const before = await draw(s);
                tick(s, 240);
                d.refresh();
                const suspension = vehicle.wheels.map((w) => ({
                  grounded: w.grounded,
                  force: w.suspensionForce,
                  length: w.suspensionLength,
                }));
                check(
                  suspension.every((w) => w.grounded && w.force > 100),
                  `Suspension failed ${JSON.stringify(suspension)}`,
                );
                check(
                  chassis.position.y > 0.65 && chassis.position.y < 0.8,
                  `Chassis equilibrium ${chassis.position.y}`,
                );
                vehicle.setControls(1);
                tick(s, 120);
                const drivenSpeed = chassis.body.velocity.z;
                check(drivenSpeed > 1, `Drive speed ${drivenSpeed}`);
                vehicle.setControls(0, 1);
                tick(s, 120);
                const brakedSpeed = Math.abs(chassis.body.velocity.z);
                check(
                  brakedSpeed < drivenSpeed * 0.3,
                  `Brake speed ${brakedSpeed}/${drivenSpeed}`,
                );
                vehicle.setControls(1, 0, 0.3);
                tick(s, 120);
                const yaw = Math.abs(chassis.body.angularVelocity.y);
                check(yaw > 0.01, `Steering yaw ${yaw}`);
                d.refresh();
                const after = await draw(s),
                  changed = difference(before, after);
                check(changed > 40, `Vehicle geometry pixels ${changed}`);
                check(
                  visual.geometry.indices.length > 0,
                  'No native chassis triangles',
                );
                vehicle.destroy();
                check(
                  s.physics3D.has(chassis),
                  'Vehicle destroyed caller chassis',
                );
                return {
                  suspension,
                  drivenSpeed,
                  brakedSpeed,
                  yaw,
                  changedPixels: changed,
                  fixedFrames: s.fixedFrame,
                  png: after.png,
                };
              } finally {
                vehicle.destroy();
                s.destroy();
              }
            },
          );
          await scenario(
            'ragdoll-fall-limited-joints-blend-teardown',
            async () => {
              const s = scene();
              floor(s);
              const a = dynamic(s, 2.5),
                b = dynamic(s, 1.5);
              const boneA = s.add(
                new E.Mesh({
                  geometry: E.Geometry.cube(0.3),
                  material: colors.body,
                  position: [0, 2.5, 0],
                }),
              );
              const boneB = s.add(
                new E.Mesh({
                  geometry: E.Geometry.cube(0.3),
                  material: colors.cloth,
                  position: [0, 1.5, 0],
                }),
              );
              const rag = new E.Ragdoll3D(s.physics3D, {
                mappings: [
                  { id: 'a', bone: boneA, body: a },
                  { id: 'b', bone: boneB, body: b },
                ],
                joints: [
                  {
                    type: 'hinge',
                    a: 'a',
                    b: 'b',
                    anchor: new E.Vector3(0, 2, 0),
                    axis: new E.Vector3(0, 0, 1),
                    lowerAngle: -0.25,
                    upperAngle: 0.25,
                  },
                ],
              });
              const d = debug(s);
              try {
                d.refresh();
                const before = await draw(s);
                b.body.applyImpulse(new E.Vector3(0.2, 0, 0));
                tick(s, 120);
                check(
                  a.position.y < 2.4,
                  `Ragdoll did not fall ${a.position.y}`,
                );
                const angle = rag.joints[0].angle;
                check(Math.abs(angle) < 0.3, `Hinge stop ${angle}`);
                rag.blend(0);
                check(
                  boneA.position.y === 2.5,
                  'Zero blend modified animation',
                );
                rag.blend(0.5);
                const half = boneA.position.y;
                check(
                  Math.abs(half - (2.5 + a.position.y) / 2) < 0.001,
                  'Half blend mismatch',
                );
                rag.blend(1);
                const [p, q] = rag.joints[0].anchors();
                const anchorError = p.subtract(q).length();
                check(anchorError < 0.1, `Joint separation ${anchorError}`);
                d.refresh();
                const after = await draw(s),
                  changed = difference(before, after);
                check(changed > 20, `Ragdoll pixels ${changed}`);
                rag.destroy();
                check(
                  s.physics3D.joints.length === 0 &&
                    s.physics3D.has(a) &&
                    s.physics3D.has(b),
                  'Ragdoll teardown removed borrowed bodies or retained joints',
                );
                return {
                  fallenY: a.position.y,
                  hingeAngle: angle,
                  anchorError,
                  halfBlendY: half,
                  changedPixels: changed,
                  png: after.png,
                };
              } finally {
                rag.destroy();
                s.destroy();
              }
            },
          );
          await scenario(
            'softbody-pinned-deformation-world-contacts-native-upload',
            async () => {
              const s = scene(),
                ground = floor(s),
                radius = 0.025;
              const positions = [],
                particles = [],
                indices = [],
                springs = [];
              for (let row = 0; row < 3; row++)
                for (let col = 0; col < 3; col++) {
                  const x = col - 1,
                    z = row - 1;
                  positions.push(x, 2, z);
                  particles.push({
                    position: new E.Vector3(x, 2, z),
                    mass: 0.3,
                    pinned: row === 0,
                  });
                  if (col)
                    springs.push({ a: row * 3 + col - 1, b: row * 3 + col });
                  if (row)
                    springs.push({ a: (row - 1) * 3 + col, b: row * 3 + col });
                }
              for (let row = 0; row < 2; row++)
                for (let col = 0; col < 2; col++) {
                  const a = row * 3 + col;
                  indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
                }
              const mesh = s.add(
                new E.Mesh({
                  geometry: new E.Geometry({
                    positions,
                    normals: Array.from({ length: 27 }, (_, i) =>
                      i % 3 === 1 ? 1 : 0,
                    ),
                    uvs: Array.from({ length: 18 }, () => 0),
                    indices,
                  }),
                  material: colors.cloth,
                }),
              );
              const soft = new E.SoftBody3D(s.physics3D, {
                particles,
                springs,
                radius,
                mesh,
                vertexParticles: particles.map((_, i) => i),
              });
              s.fixedUpdate = (dt) => soft.update(dt);
              try {
                const before = await draw(s);
                tick(s, 240);
                const sagY = soft.particles[8].position.y;
                check(
                  sagY < 1.8 && soft.particles[0].position.y === 2,
                  `Sag/pin failed ${sagY}`,
                );
                const after = await draw(s),
                  changed = difference(before, after);
                check(
                  changed > 40 && mesh.geometry.version > 0,
                  `Deformation native pixels/version ${changed}/${mesh.geometry.version}`,
                );
                soft.unpin(0);
                soft.unpin(1);
                soft.unpin(2);
                tick(s, 480);
                const settled = soft.particles.map((p) => ({
                  y: p.position.y,
                  speed: p.velocity.length(),
                }));
                check(
                  settled.every(
                    (p) =>
                      p.y >= ground.position.y + radius - 0.001 &&
                      p.y < ground.position.y + radius + 0.015 &&
                      p.speed < 0.1,
                  ),
                  `Contacts did not settle above authored plane ${ground.position.y}: ${JSON.stringify(settled)}`,
                );
                soft.pin(4, new E.Vector3(0, 1, 0));
                tick(s, 1);
                check(soft.particles[4].position.y === 1, 'Repin failed');
                return {
                  sagY,
                  settled,
                  groundY: ground.position.y,
                  radius,
                  changedPixels: changed,
                  geometryVersion: mesh.geometry.version,
                  png: after.png,
                };
              } finally {
                soft.destroy();
                s.destroy();
              }
            },
          );
          await scenario(
            'debug-live-wireframe-immutable-snapshots-pixel-proof',
            async () => {
              const s = scene();
              const object = dynamic(s, 1, true);
              object.body.gravityScale = 0;
              const d = debug(s);
              try {
                const snapshot = s.physics3D.debugSnapshot();
                d.refresh(snapshot);
                const before = await draw(s);
                object.position.x = 2;
                d.refresh();
                const after = await draw(s),
                  changed = difference(before, after);
                check(changed > 40, `Debug live pixels ${changed}`);
                check(
                  Object.isFrozen(snapshot.segments[0].from) &&
                    snapshot.segments[0].from[0] !==
                      s.physics3D.debugSnapshot().segments[0].from[0],
                  'Debug snapshot was mutated',
                );
                return {
                  segments: snapshot.segments.length,
                  nativeChildren: d.children.size,
                  changedPixels: changed,
                  png: after.png,
                };
              } finally {
                s.destroy();
              }
            },
          );
          check(
            !proofs.graphicsEvents.length,
            `Native graphics errors ${proofs.graphicsEvents.join(';')}`,
          );
          return {
            backend,
            passed: scenarios.every((s) => s.passed),
            scenarios,
            graphicsEvents: [...proofs.graphicsEvents],
          };
        } finally {
          renderer.destroy();
          texture.destroy();
        }
      }, backend);
      for (const scenario of result.scenarios)
        if (scenario.png) {
          const name = `${backend}-${scenario.name}.png`;
          await writeFile(
            resolve(directory, name),
            Buffer.from(scenario.png.split(',')[1], 'base64'),
          );
          scenario.png = name;
        }
      result.browserErrors = errors;
      if (errors.length) result.passed = false;
      report.results.push(result);
    } catch (error) {
      report.errors.push(`${backend}: ${error.stack ?? error}`);
    }
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
  await writeFile(
    resolve(directory, 'report.json'),
    JSON.stringify(report, null, 2),
  );
}
console.log(JSON.stringify(report, null, 2));
if (
  report.errors.length ||
  report.results.length !== 2 ||
  report.results.some((r) => !r.passed)
)
  process.exitCode = 1;

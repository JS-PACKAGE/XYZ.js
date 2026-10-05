import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { performance } from 'node:perf_hooks';

const directory = await mkdtemp(join(tmpdir(), 'xyz-bounded-work-'));
try {
  const module = join(directory, 'source-loader.mjs');
  const root = pathToFileURL(resolve('.') + '/').href;
  // Development-only TypeScript loader isolates current source without modifying dist.
  await writeFile(
    module,
    `import {registerHooks} from 'node:module';import {readFileSync,existsSync} from 'node:fs';import ts from ${JSON.stringify(import.meta.resolve('typescript'))};
registerHooks({
resolve(specifier,context,next){if(specifier.endsWith('.js')&&context.parentURL?.startsWith(${JSON.stringify(root)})){const url=new URL(specifier,context.parentURL);if(!existsSync(url)){url.pathname=url.pathname.slice(0,-3)+'.ts';if(existsSync(url))return next(url.href,context);}}return next(specifier,context);},
load(url,context,next){if(url.startsWith(${JSON.stringify(root)})&&url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};return next(url,context);}
});`,
  );
  const source = JSON.stringify(pathToFileURL(resolve('src/index.ts')).href);
  const cases = [
    [
      'tiny-infinite-cutscene',
      `const errors=[]; const d=new E.CutsceneDirector({duration:Number.MIN_VALUE,repeat:Infinity,onError:e=>errors.push(e)});d.play();let error;try{d.update(1)}catch(e){error=e}assert(error instanceof RangeError&&/work budget/.test(error.message)&&d.status==='error'&&errors.length===1);d.destroy();`,
    ],
    [
      'enormous-cutscene-delta',
      `const d=new E.CutsceneDirector({duration:1,repeat:Infinity});d.play();let error;try{d.update(Number.MAX_VALUE)}catch(e){error=e}assert(error instanceof RangeError&&/work budget/.test(error.message)&&d.status==='error');d.destroy();`,
    ],
    [
      'unrepresentable-crowd-grid',
      `const s=new E.Scene(),o=s.add(new E.Object3D());o.collider=new E.CapsuleCollider3D(.25,1);o.position.set(1e20,1,0);const c=new E.CharacterController3D(o,s.physics3D,{groundSnap:0,stepHeight:0}), crowd=new E.CrowdSolver({neighborDistance:10});crowd.register3D(c,{id:1,radius:.3,maxSpeed:1});let error;try{crowd.update(1/60,1)}catch(e){error=e}assert(error instanceof RangeError&&/representable/.test(error.message)&&o.position.x===1e20);o.position.x=0;crowd.update(1/60,1);crowd.destroy();c.destroy();s.destroy();`,
    ],
  ];
  for (const [name, body] of cases) {
    const started = performance.now();
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        module,
        '--input-type=module',
        '-e',
        `import assert from 'node:assert/strict';import * as E from ${source};${body}console.log('passed');`,
      ],
      { timeout: 10000, encoding: 'utf8' },
    );
    const report = {
      name,
      status: result.status,
      signal: result.signal,
      elapsedMilliseconds: performance.now() - started,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      error: result.error?.message,
    };
    console.log(JSON.stringify(report));
    if (result.error || result.status !== 0 || report.stdout !== 'passed')
      throw new Error(`Isolated bounded-work failure: ${name}`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}

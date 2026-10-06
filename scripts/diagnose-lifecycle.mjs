import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { browserLaunchOptions } from './browser-launch.mjs';
const root = process.cwd();
const output = resolve(root, '.vite/lifecycle-diagnostic');
await mkdir(output, {recursive:true});
const vite = await createServer({root,resolve:{alias:[{find:'../../src/index.js',replacement:resolve(root,'dist/src/index.js')}]},server:{host:'127.0.0.1',port:5207,strictPort:true}});
await vite.listen();
const browser = await chromium.launch(await browserLaunchOptions('chromium'));
try {
  const context = await browser.newContext();
  const previous = await context.newPage();
  await previous.goto('http://127.0.0.1:5207/tests/browser/post-effects.html?renderer=webgpu');
  await previous.waitForFunction(()=>document.querySelector('#report')?.dataset.state==='passed',undefined,{timeout:180000});
  const page = await context.newPage();
  await page.addInitScript(()=>{
    const counters = globalThis.lifecycleDiagnostics = {rafRequested:0,rafResolved:0,mapRequested:0,mapResolved:0,mapRejected:0};
    const raf = requestAnimationFrame;
    globalThis.requestAnimationFrame = callback => {counters.rafRequested++;return raf.call(globalThis,time=>{counters.rafResolved++;callback(time);});};
    const map = GPUBuffer.prototype.mapAsync;
    GPUBuffer.prototype.mapAsync = function(...args){counters.mapRequested++;return map.apply(this,args).then(value=>{counters.mapResolved++;return value;},error=>{counters.mapRejected++;throw error;});};
  });
  const start=Date.now();
  await page.goto('http://127.0.0.1:5207/tests/browser/material-lifecycle.html?renderer=webgpu');
  let final;
  for(let sample=0;sample<40;sample++){
    await setTimeout(15000);
    const state=await page.evaluate(()=>({state:document.querySelector('#report')?.dataset.state,report:JSON.parse(document.querySelector('#report')?.textContent||'{}'),hidden:document.hidden,visibility:document.visibilityState,counters:globalThis.lifecycleDiagnostics}));
    final=state;
    console.log('LIFECYCLE_PROGRESS',JSON.stringify({elapsedMs:Date.now()-start,state:state.state,cycles:state.report.cycles?.length,hidden:state.hidden,visibility:state.visibility,counters:state.counters}));
    await writeFile(resolve(output,'progress.json'),JSON.stringify({...state,elapsedMs:Date.now()-start},null,2));
    if(['passed','failed'].includes(state.state))break;
  }
  await page.screenshot({path:resolve(output,'final.png')});
  if(final?.state!=='passed'||final.report.cycles.length!==8)throw new Error('Eight real lifecycle cycles did not pass');
} finally {await browser.close();await vite.close();}

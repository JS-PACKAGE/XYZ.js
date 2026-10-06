import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import console from 'node:console';
import { setTimeout, clearTimeout } from 'node:timers';

mkdirSync('.vite/site-diagnostic', { recursive: true });
const child = spawn(process.execPath, ['scripts/smoke-site.mjs', '--example', 'world-nature', '--output', '.vite/site-diagnostic/results'], {
  detached: true,
  stdio: 'inherit',
  env: { ...process.env, DEBUG: 'pw:api,pw:browser' },
});
const timers = [45, 90].map((seconds) => setTimeout(() => {
  const listing = spawnSync('ps', ['-axo', 'pid,ppid,pgid,%cpu,state,command'], { encoding: 'utf8' }).stdout;
  writeFileSync(`.vite/site-diagnostic/processes-${seconds}.txt`, listing);
  const processes = listing.split('\n').filter((line) => Number(line.trim().split(/\s+/)[2]) === child.pid);
  console.log(`OWNED PROCESS SNAPSHOT ${seconds}s\n${processes.join('\n')}`);
  for (const line of processes) {
    if (!line.includes('chrome-headless-shell')) continue;
    const pid = line.trim().split(/\s+/)[0];
    spawnSync('sample', [pid, '1', '-file', `.vite/site-diagnostic/sample-${seconds}-${pid}.txt`], { timeout: 10000 });
  }
}, seconds * 1000));
const deadline = setTimeout(() => {
  console.error('Diagnostic deadline: terminating only the owned process group.');
  process.kill(-child.pid, 'SIGKILL');
}, 120000);
child.on('exit', (code, signal) => {
  clearTimeout(deadline);
  timers.forEach(clearTimeout);
  console.log({ code, signal });
  process.exitCode = code ?? 1;
});

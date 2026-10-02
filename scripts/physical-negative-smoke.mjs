import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import console from 'node:console';
import { gates, prepare, verifyEvidence } from './physical-qualification.mjs';

// Safe protocol smoke only. Never touches browsers, device bridges, OS controls,
// physical output or existing evidence. The regression suite exercises complete
// hash-bound traces with untrusted events, including signed fake review fixtures.
const root = await mkdtemp(join(tmpdir(), 'xyz-physical-negative-'));
try {
  for (const gate of gates) {
    const evidence = prepare(gate);
    evidence.mode = 'mobile-emulation';
    evidence.emulated = true;
    evidence.observations = [
      {
        event: 'synthetic',
        source: 'native',
        trusted: true,
        value: { selfAssertedPhysicalPass: true },
      },
    ];
    const path = join(root, `${gate}.json`);
    await writeFile(path, JSON.stringify(evidence));
    const result = await verifyEvidence(path);
    assert.equal(
      result.status,
      'BLOCKED',
      `${gate}: synthetic evidence must never certify physical`,
    );
    assert.equal(result.certification, false);
    console.log(
      `${gate}: BLOCKED — synthetic/emulated evidence is ineligible; actual owned device/authorization remains unavailable.`,
    );
  }
} finally {
  await rm(root, { recursive: true, force: true });
}

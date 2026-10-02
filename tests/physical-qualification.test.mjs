import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import {
  prepare,
  verifyEvidence,
  digest,
  reviewStatement,
  attestationStatement,
} from '../scripts/physical-qualification.mjs';
import {
  readAuthorization,
  authorizationStatement,
} from '../scripts/physical-authorization.mjs';

// These fixtures exercise review/provenance rules; they are fabricated test data,
// never hardware evidence. Passing a fixture is not physical qualification.
async function fixture(change = () => {}) {
  const root = await mkdtemp(join(tmpdir(), 'xyz-qualification-'));
  const evidence = prepare('bfcache');
  const start = '2026-01-01T00:00:00.000Z',
    end = '2026-01-01T00:00:10.000Z';
  Object.assign(evidence, {
    startedAt: start,
    endedAt: end,
    durationMs: 10000,
    declaredDurationMs: 1000,
  });
  Object.assign(evidence.identity, {
    operator: 'test-operator',
    deviceModel: 'fixture-device',
    os: 'fixture-os',
    osBuild: 'fixture-build',
    browser: 'fixture-native-browser',
    browserVersion: 'fixture-version',
    renderer: 'canvas2d',
    driverSource: 'fixture-diagnostic',
    driverVersion: 'fixture-version',
    identityArtifact: 'diagnostic',
  });
  evidence.source = {
    commit: 'a'.repeat(40),
    packageVersion: '1.12.1',
    builtEntrySha256: 'b'.repeat(64),
  };
  evidence.authorization = {
    ownedDevice: true,
    authorizedOperator: true,
    authorizedOrigin: 'https://fixture.invalid',
    noSharedSessions: true,
    noDriverModification: true,
    noAudibleOutput: true,
  };
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=',
    'base64',
  );
  const trace = {
    schemaVersion: 2,
    kind: 'xyz-physical-interaction-trace',
    collectionMode: 'operator-interaction-unverified',
    certification: false,
    session: evidence.identity.session,
    documentId: 'fixture-document',
    source: evidence.source,
    startedAt: start,
    endedAt: end,
    truncated: false,
    environment: {
      origin: 'https://fixture.invalid',
      secureContext: true,
      webdriver: false,
      userAgent: 'fixture-agent',
    },
    samples: [
      {
        sequence: 0,
        at: '2026-01-01T00:00:01.000Z',
        event: 'pagehide',
        source: 'native-event',
        trusted: true,
        value: { persisted: true, documentId: 'fixture-document' },
      },
      {
        sequence: 1,
        at: '2026-01-01T00:00:02.000Z',
        event: 'pageshow',
        source: 'native-event',
        trusted: true,
        value: { persisted: true, documentId: 'fixture-document' },
      },
      {
        sequence: 2,
        at: '2026-01-01T00:00:03.000Z',
        event: 'rendered-after-return',
        source: 'measurement',
        trusted: null,
        value: {
          pixelSha256: 'c'.repeat(64),
          png: `data:image/png;base64,${png.toString('base64')}`,
          gameState: 'running',
        },
      },
    ],
  };
  evidence.observations = trace.samples.map((sample) => ({
    sequence: sample.sequence,
    event: sample.event,
    captureArtifact: 'capture',
    captureLocator: `frame ${sample.sequence}`,
  }));
  evidence.scenarios = [
    {
      id: 'round-trip',
      expected: 'same document restored with live rendering',
      observed: 'fixture restoration and frame',
      outcome: 'PASS',
      startedAt: start,
      endedAt: end,
      durationMs: 10000,
      events: trace.samples.map((sample) => sample.event),
    },
  ];
  evidence.attestation = {
    operator: evidence.identity.operator,
    signedName: 'fixture operator signature',
    signedAt: end,
    statement: attestationStatement,
  };
  change(evidence, trace);
  for (const [id, role, bytes] of [
    ['trace', 'machine-trace', Buffer.from(JSON.stringify(trace))],
    ['capture', 'native-capture', png],
    [
      'diagnostic',
      'os-diagnostic',
      Buffer.from('fabricated test-only device identity diagnostic'),
    ],
  ]) {
    await writeFile(join(root, `${id}.bin`), bytes);
    evidence.artifacts.push({
      id,
      role,
      path: `${id}.bin`,
      sha256: digest(bytes),
      captureSource: 'test fixture, not physical',
      description: `fixture ${role}`,
    });
  }
  const path = join(root, 'evidence.json');
  await writeFile(path, JSON.stringify(evidence));
  const review = {
    schemaVersion: 2,
    evidenceSha256: digest(await readFile(path)),
    reviewer: 'test-independent-reviewer',
    signedName: 'fixture review signature',
    signedAt: end,
    statement: reviewStatement,
    decision: 'ACCEPT',
    notes:
      'TEST ONLY: no physical authenticity assertion outside this fixture.',
  };
  const reviewPath = join(root, 'review.json');
  await writeFile(reviewPath, JSON.stringify(review));
  return { root, path, reviewPath, evidence, trace, review };
}
async function using(change, check) {
  const item = await fixture(change);
  try {
    await check(item);
  } finally {
    await rm(item.root, { recursive: true, force: true });
  }
}

describe('physical qualification human trust boundaries', () => {
  it('never automatically promotes structurally valid evidence to physical acceptance', async () => {
    await using(undefined, async ({ path, reviewPath }) => {
      expect((await verifyEvidence(path)).status).toBe(
        'EVIDENCE-READY-FOR-REVIEW',
      );
      expect((await verifyEvidence(path)).certification).toBe(false);
      const reviewed = await verifyEvidence(path, reviewPath);
      expect(reviewed.status).toBe('PHYSICAL-PASS-HUMAN-ATTESTED');
      expect(reviewed.certification).toBe('human-attestation-only');
    });
  });
  it('rejects synthetic persisted lifecycle events even with signed review', async () => {
    await using(
      (_e, trace) => {
        trace.samples[0].trusted = false;
        trace.samples[1].trusted = false;
      },
      async ({ path, reviewPath }) => {
        const result = await verifyEvidence(path, reviewPath);
        expect(result.status).toBe('BLOCKED');
        expect(
          result.failures.some((failure) =>
            failure.includes('Synthetic/untrusted'),
          ),
        ).toBe(true);
      },
    );
  });
  it('rejects browser automation despite native isTrusted events', async () => {
    await using(
      (_e, trace) => {
        trace.environment.webdriver = true;
      },
      async ({ path, reviewPath }) => {
        expect((await verifyEvidence(path, reviewPath)).status).toBe('BLOCKED');
      },
    );
  });
  it.each(['reload', 'different-document', 'reversed'])(
    'rejects %s substituted for a BFCache return',
    async (kind) => {
      await using(
        (_e, trace) => {
          if (kind === 'reload') trace.samples[1].value.persisted = false;
          if (kind === 'different-document')
            trace.samples[1].value.documentId = 'new-document';
          if (kind === 'reversed')
            [trace.samples[0].event, trace.samples[1].event] = [
              'pageshow',
              'pagehide',
            ];
        },
        async ({ path, reviewPath }) => {
          expect((await verifyEvidence(path, reviewPath)).status).toBe(
            'BLOCKED',
          );
        },
      );
    },
  );
  it('invalidates exact-byte review after evidence changes', async () => {
    await using(undefined, async ({ path, reviewPath, evidence }) => {
      evidence.identity.browserVersion = 'changed-version';
      await writeFile(path, JSON.stringify(evidence));
      expect((await verifyEvidence(path, reviewPath)).failures).toContain(
        'Review must bind exact evidence bytes.',
      );
    });
  });
  it('rejects changed native capture and escaped artifact symlinks', async () => {
    await using(undefined, async ({ root, path, reviewPath }) => {
      await writeFile(join(root, 'capture.bin'), 'not a native capture');
      expect((await verifyEvidence(path, reviewPath)).status).toBe('BLOCKED');
      const outside = await mkdtemp(
        join(tmpdir(), 'xyz-qualification-outside-'),
      );
      try {
        await writeFile(join(outside, 'diagnostic'), 'outside-owned-test-file');
        await rm(join(root, 'diagnostic.bin'));
        await symlink(
          join(outside, 'diagnostic'),
          join(root, 'diagnostic.bin'),
        );
        expect(
          (await verifyEvidence(path, reviewPath)).failures.some((failure) =>
            failure.includes('within evidence directory'),
          ),
        ).toBe(true);
      } finally {
        await rm(outside, { recursive: true, force: true });
      }
    });
  });
  it.each(['physical-audio', 'spoken-at'])(
    'keeps %s blocked under no-sound authorization',
    async (gate) => {
      await using(
        (evidence) => {
          evidence.gate = gate;
        },
        async ({ path, reviewPath }) => {
          const result = await verifyEvidence(path, reviewPath);
          expect(result.status).toBe('BLOCKED');
          expect(result.failures).toContain(
            'Explicit no-physical-sound boundary blocks this gate.',
          );
        },
      );
    },
  );
  it('requires authorized isolated Safari scope before browser actions', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xyz-authorization-'));
    try {
      await expect(
        readAuthorization(
          undefined,
          'native-safari-automation',
          'http://127.0.0.1:5216',
        ),
      ).rejects.toThrow('BLOCKED');
      const path = join(root, 'authorization.json');
      const auth = {
        schemaVersion: 1,
        scope: 'native-safari-automation',
        origin: 'http://127.0.0.1:5216',
        ownedEnvironment: true,
        isolatedSession: false,
        noAudibleOutput: true,
        operator: 'operator',
        signedName: 'signature',
        signedAt: '2026-01-01T00:00:00Z',
        statement: authorizationStatement,
      };
      await writeFile(path, JSON.stringify(auth));
      await expect(
        readAuthorization(path, auth.scope, auth.origin),
      ).rejects.toThrow('BLOCKED');
      auth.isolatedSession = true;
      await writeFile(path, JSON.stringify(auth));
      expect(
        (await readAuthorization(path, auth.scope, auth.origin)).trustBoundary,
      ).toContain('not machine proof');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

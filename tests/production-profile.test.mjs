/* global structuredClone */
import { describe, expect, it } from 'vitest';
import {
  calibrateProfile,
  evaluateProfile,
  phaseMetrics,
  validateProfile,
} from '../scripts/production-profile.mjs';
import { productionCalibrationDefaults as margins } from '../src/data/observability.js';

const host = {
  platform: 'darwin',
  architecture: 'arm64',
  cpuModel: 'Fixture CPU',
  osRelease: 'fixture',
};
function result(run = 1) {
  const timing = (p95, maximum = p95) => ({
    count: 100,
    p95,
    max: maximum,
    longFramesOver50Ms: 5,
  });
  const phase = () => ({
    frameIntervalMs: timing(60, 120),
    cpuFrameWorkMs: timing(10, 20),
    cpuSubmitMs: timing(5, 10),
  });
  return {
    schema: 'xyz-production-workload-v2',
    result: 'PASS',
    workload: '2d',
    run,
    backend: 'webgl2',
    quality: 'baseline',
    counts: { measuredFrames: 100, loadStageFrames: 100 },
    regressionSettings: {
      minimumSteadySeconds: 5,
      minimumLoadingSeconds: 2,
      teardownMaximumMs: 5000,
    },
    stageWallMs: { steady: 5000, 'asset-loading': 2000 },
    stages: { steady: phase(), 'asset-loading': phase() },
    operations: { teardownWallMs: 5000 },
    browser: { version: '153.0.0.1' },
    deviceProfile: { name: 'native' },
    presentation: { mode: 'headless' },
    errors: [],
    provenance: {
      hardwareConcurrency: 3,
      gpu: { vendor: 'Fixture vendor', renderer: 'Fixture GPU' },
    },
    launchArguments: ['--mute-audio'],
    gate: { functionalStatus: 'PASS' },
  };
}
const baseline = () =>
  calibrateProfile(
    [result(1), result(2), result(3)],
    host,
    margins,
    'reviewed',
  );

describe('pinned production performance policy', () => {
  it('enforces p95, hitches and maximum independently for loading and steady phases', () => {
    const profile = baseline();
    const sample = result();
    expect(evaluateProfile(sample, profile, host, 5000).status).toBe('PASS');
    sample.stages['asset-loading'].cpuSubmitMs.p95 =
      profile.bounds['2d']['asset-loading'].cpuSubmitP95Ms + 0.001;
    const gate = evaluateProfile(sample, profile, host, 5000);
    expect(gate.functionalStatus).toBe('PASS');
    expect(gate.performanceStatus).toBe('FAIL');
    expect(gate.failureKind).toBe('performance');
    expect(
      gate.checks.find(
        (check) => check.path === 'stages.asset-loading.cpuSubmitP95Ms',
      ).status,
    ).toBe('FAIL');
    sample.stages['asset-loading'].cpuSubmitMs.p95 = 5;
    sample.stages.steady.frameIntervalMs.longFramesOver50Ms = 8;
    expect(evaluateProfile(sample, profile, host, 5000).performanceStatus).toBe(
      'FAIL',
    );
    sample.stages.steady.frameIntervalMs.longFramesOver50Ms = 5;
    sample.stages.steady.frameIntervalMs.max =
      profile.bounds['2d'].steady.rafMaxMs + 1;
    expect(evaluateProfile(sample, profile, host, 5000).performanceStatus).toBe(
      'FAIL',
    );
  });
  it('blocks GPU/backend/host/workload mismatch instead of silently widening a budget', () => {
    const profile = baseline();
    const sample = result();
    sample.provenance.gpu.renderer = 'Different physical or virtual GPU';
    const gate = evaluateProfile(sample, profile, host, 5000);
    expect(gate.status).toBe('BLOCKED');
    expect(gate.mismatches[0].path).toBe('identity.gpu');
    expect(
      evaluateProfile(
        result(),
        profile,
        { ...host, cpuModel: 'Other CPU' },
        5000,
      ).status,
    ).toBe('BLOCKED');
    sample.provenance.gpu = structuredClone(profile.expected.gpu);
    sample.counts.measuredFrames++;
    expect(evaluateProfile(sample, profile, host, 5000).status).toBe('BLOCKED');
  });
  it('blocks changed or unavailable presentation rather than reusing another mode’s profile', () => {
    const profile = baseline();
    const sample = result();
    sample.presentation.mode = 'native-foreground';
    const gate = evaluateProfile(sample, profile, host, 5000);
    expect(gate.status).toBe('BLOCKED');
    expect(gate.mismatches).toContainEqual({
      path: 'identity.presentation',
      expected: 'headless',
      actual: 'native-foreground',
    });
    delete sample.presentation;
    expect(evaluateProfile(sample, profile, host, 5000).status).toBe('BLOCKED');
    delete profile.expected.presentation;
    expect(() => validateProfile(profile)).toThrow();
  });
  it('preserves lifecycle failure independently of profile and distinguishes functional failure', () => {
    const sample = result();
    sample.operations.teardownWallMs = 5000.001;
    expect(evaluateProfile(sample, null, host, 5000).status).toBe('FAIL');
    sample.operations.teardownWallMs = 5000;
    expect(evaluateProfile(sample, null, host, 5000).performanceStatus).toBe(
      'BLOCKED',
    );
    sample.result = 'FAIL';
    expect(evaluateProfile(sample, baseline(), host, 5000).failureKind).toBe(
      'functional',
    );
  });
  it('blocks unavailable percentiles and rejects insufficient phase evidence', () => {
    const sample = result();
    sample.stages.steady.frameIntervalMs.p95 = null;
    expect(evaluateProfile(sample, baseline(), host, 5000).status).toBe(
      'BLOCKED',
    );
    sample.stages.steady.frameIntervalMs.p95 = 60;
    sample.stageWallMs.steady = 4999;
    expect(evaluateProfile(sample, baseline(), host, 5000).status).toBe('FAIL');
  });
  it('calibrates from every planned run including the worst sample without certification', () => {
    const samples = [result(1), result(2), result(3)];
    samples[1].stages.steady.cpuFrameWorkMs.p95 = 40;
    const profile = calibrateProfile(samples, host, margins, 'reviewed');
    expect(profile.bounds['2d'].steady.cpuFrameP95Ms).toBe(
      40 * (1 + margins.relativeMargin) + margins.absoluteMarginMs,
    );
    expect(
      profile.calibration.observations['2d'].steady.map(
        (sample) => sample.cpuFrameP95Ms,
      ),
    ).toEqual([10, 40, 10]);
    expect(profile.calibration.runs).toBe(3);
    expect(profile).not.toHaveProperty('status');
    expect(phaseMetrics(samples[0], 'steady').hitchFraction).toBe(0.05);
  });
  it('rejects failed, mixed-host and incomplete calibrations rather than retrying/dropping them', () => {
    const samples = [result(1), result(2), result(3)];
    samples[1].gate.functionalStatus = 'FAIL';
    expect(() => calibrateProfile(samples, host, margins, 'reviewed')).toThrow(
      'aborted',
    );
    samples[1].gate.functionalStatus = 'PASS';
    samples[1].provenance.hardwareConcurrency = 4;
    expect(() => calibrateProfile(samples, host, margins, 'reviewed')).toThrow(
      'identity',
    );
    expect(() =>
      calibrateProfile([result(1), result(2)], host, margins, 'reviewed'),
    ).toThrow('run count');
  });
  it('requires a complete frame/hitch policy, not an operation-only PASS certificate', () => {
    const profile = baseline();
    delete profile.bounds['2d']['asset-loading'].hitchFraction;
    expect(() => validateProfile(profile)).toThrow('hitchFraction');
  });
});

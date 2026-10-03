import { isDeepStrictEqual } from 'node:util';

export const profileSchema = 'xyz-production-profile-v1';
export const phases = ['steady', 'asset-loading'];
export const metrics = Object.freeze({
  rafP95Ms: ['frameIntervalMs', 'p95'],
  rafMaxMs: ['frameIntervalMs', 'max'],
  hitchFraction: ['frameIntervalMs', 'hitchFraction'],
  cpuFrameP95Ms: ['cpuFrameWorkMs', 'p95'],
  cpuFrameMaxMs: ['cpuFrameWorkMs', 'max'],
  cpuSubmitP95Ms: ['cpuSubmitMs', 'p95'],
  cpuSubmitMaxMs: ['cpuSubmitMs', 'max'],
});
const finite = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function validateProfile(profile) {
  if (
    profile?.schema !== profileSchema ||
    !['calibrated', 'operator-policy'].includes(profile?.provenance) ||
    typeof profile.name !== 'string' ||
    !profile.name ||
    !profile.expected ||
    !profile.workload ||
    !profile.bounds
  )
    throw new Error('Invalid pinned production profile schema.');
  for (const key of [
    'platform',
    'architecture',
    'browserMajor',
    'hardwareConcurrency',
    'backend',
    'quality',
    'device',
    'presentation',
    'gpu',
    'launchArguments',
  ])
    if (!Object.hasOwn(profile.expected, key))
      throw new Error(`Profile must pin expected.${key}.`);
  const gpu = profile.expected.gpu;
  const gpuIdentity =
    profile.expected.backend === 'webgl2'
      ? [gpu?.renderer]
      : [gpu?.vendor, gpu?.architecture, gpu?.device, gpu?.description];
  if (
    !['webgl2', 'webgpu', 'canvas2d'].includes(profile.expected.backend) ||
    (profile.expected.backend !== 'canvas2d' &&
      !gpuIdentity.some((value) => typeof value === 'string' && value.length))
  )
    throw new Error(
      'Native profiles require non-redacted GPU identity, not just a provenance source.',
    );
  if (
    !Number.isInteger(profile.expected.browserMajor) ||
    profile.expected.browserMajor < 1 ||
    !Number.isInteger(profile.expected.hardwareConcurrency) ||
    profile.expected.hardwareConcurrency < 1 ||
    !Array.isArray(profile.expected.launchArguments) ||
    !['headless', 'native-foreground'].includes(profile.expected.presentation)
  )
    throw new Error('Invalid pinned browser/host identity.');
  if (
    profile.provenance === 'calibrated' &&
    (!Number.isInteger(profile.calibration?.runs) ||
      profile.calibration.runs < 3 ||
      !profile.calibration.observations ||
      !profile.calibration.margins)
  )
    throw new Error(
      'A calibrated profile requires at least three recorded successful runs and explicit margins.',
    );
  for (const [workload, bounds] of Object.entries(profile.bounds)) {
    for (const phase of phases)
      for (const metric of Object.keys(metrics)) {
        const maximum = bounds?.[phase]?.[metric];
        if (!finite(maximum) || (metric === 'hitchFraction' && maximum > 1))
          throw new Error(
            `Missing/invalid bound: ${workload}.${phase}.${metric}.`,
          );
      }
  }
  if (!Object.keys(profile.bounds).length)
    throw new Error('Profile has no workload bounds.');
  return profile;
}

export function profileIdentity(result, host) {
  return {
    platform: host.platform,
    architecture: host.architecture,
    cpuModel: host.cpuModel,
    osRelease: host.osRelease,
    browserMajor: Number(result.browser.version.split('.')[0]),
    hardwareConcurrency: result.provenance.hardwareConcurrency,
    gpu: result.provenance.gpu,
    backend: result.backend,
    quality: result.quality,
    device: result.deviceProfile.name,
    presentation: result.presentation?.mode ?? null,
    launchArguments: result.launchArguments,
  };
}

export function workloadIdentity(result) {
  return {
    schema: result.schema,
    counts: result.counts,
    regressionSettings: result.regressionSettings,
  };
}

export function phaseMetrics(result, phase) {
  const timings = result.stages?.[phase];
  return Object.fromEntries(
    Object.entries(metrics).map(([name, [series, statistic]]) => {
      const timing = timings?.[series];
      const value =
        statistic === 'hitchFraction'
          ? timing?.count > 0
            ? timing.longFramesOver50Ms / timing.count
            : null
          : timing?.[statistic];
      return [name, value];
    }),
  );
}

/** A profile mismatch is blocked evidence, never a relaxed threshold or another attempt. */
export function evaluateProfile(result, profile, host, teardownMaximumMs) {
  const checks = [
    {
      path: 'operations.teardownWallMs',
      maximum: teardownMaximumMs,
      actual: result.operations?.teardownWallMs,
    },
  ];
  const identity =
    result.provenance && result.browser ? profileIdentity(result, host) : null;
  const mismatches = [];
  if (profile && identity) {
    for (const [key, expected] of Object.entries(profile.expected))
      if (!isDeepStrictEqual(identity[key], expected))
        mismatches.push({
          path: `identity.${key}`,
          expected,
          actual: identity[key] ?? null,
        });
    if (!isDeepStrictEqual(workloadIdentity(result), profile.workload))
      mismatches.push({
        path: 'workload',
        expected: profile.workload,
        actual: workloadIdentity(result),
      });
    const bounds = profile.bounds[result.workload];
    if (!bounds)
      mismatches.push({
        path: `bounds.${result.workload}`,
        expected: 'pinned bounds',
        actual: null,
      });
    for (const phase of mismatches.length ? [] : phases) {
      const minimumFrames =
        phase === 'steady'
          ? result.counts.measuredFrames
          : result.counts.loadStageFrames;
      checks.push({
        path: `stages.${phase}.minimumSamples`,
        minimum: minimumFrames,
        actual: result.stages?.[phase]?.cpuFrameWorkMs?.count,
      });
      const minimumMs =
        (phase === 'steady'
          ? result.regressionSettings.minimumSteadySeconds
          : result.regressionSettings.minimumLoadingSeconds) * 1000;
      checks.push({
        path: `stages.${phase}.minimumWallMs`,
        minimum: minimumMs,
        actual: result.stageWallMs?.[phase],
      });
      const measured = phaseMetrics(result, phase);
      if (bounds)
        for (const metric of Object.keys(metrics))
          checks.push({
            path: `stages.${phase}.${metric}`,
            maximum: bounds[phase][metric],
            actual: measured[metric],
          });
    }
  }
  for (const check of checks)
    check.status = !finite(check.actual)
      ? 'BLOCKED'
      : (
            check.minimum !== undefined
              ? check.actual < check.minimum
              : check.actual > check.maximum
          )
        ? 'FAIL'
        : 'PASS';
  const functionalStatus =
    result.result === 'PASS' &&
    !result.errors?.length &&
    !result.nativeTimingFailed
      ? 'PASS'
      : 'FAIL';
  const performanceStatus =
    !profile || mismatches.length
      ? 'BLOCKED'
      : checks.some((check) => check.status === 'FAIL')
        ? 'FAIL'
        : checks.some((check) => check.status === 'BLOCKED')
          ? 'BLOCKED'
          : 'PASS';
  return {
    status:
      functionalStatus === 'FAIL' ||
      checks.some((check) => check.status === 'FAIL')
        ? 'FAIL'
        : performanceStatus,
    functionalStatus,
    performanceStatus,
    failureKind:
      functionalStatus === 'FAIL'
        ? 'functional'
        : checks.some((check) => check.status === 'FAIL')
          ? 'performance'
          : null,
    profile: profile
      ? { name: profile.name, provenance: profile.provenance }
      : null,
    checks,
    mismatches,
    reason:
      functionalStatus === 'FAIL'
        ? (result.error ??
          (result.nativeTimingFailed
            ? 'Engine-free native timestamps work but engine recorded no valid samples.'
            : 'Functional workload or browser errors.'))
        : !profile
          ? 'Measurement/functional evidence only; no pinned frame/hitch regression profile supplied.'
          : mismatches.length
            ? 'Pinned host/GPU/backend/workload provenance mismatch; no certification.'
            : null,
    scope:
      'Only the explicit host, backend, authored workload and pinned policy. No universal 60fps or physical hardware certification.',
  };
}

/** Every run is planned up front; a failed run aborts calibration, it is never retried. */
export function calibrateProfile(results, host, defaults, name) {
  const workloads = [...new Set(results.map((result) => result.workload))];
  const runs = results.filter(
    (result) => result.workload === workloads[0],
  ).length;
  if (runs < defaults.minimumRuns || runs > defaults.maximumRuns)
    throw new Error('Invalid calibration run count.');
  const expected = profileIdentity(results[0], host);
  const workload = workloadIdentity(results[0]);
  const bounds = {},
    observations = {};
  for (const kind of workloads) {
    const samples = results.filter((result) => result.workload === kind);
    if (samples.length !== runs)
      throw new Error('Incomplete calibration workload matrix.');
    for (const sample of samples) {
      if (
        sample.gate.functionalStatus !== 'PASS' ||
        !finite(sample.operations.teardownWallMs) ||
        sample.operations.teardownWallMs >
          sample.regressionSettings.teardownMaximumMs
      )
        throw new Error(
          'Calibration aborted by functional or lifecycle failure.',
        );
      if (
        !isDeepStrictEqual(profileIdentity(sample, host), expected) ||
        !isDeepStrictEqual(workloadIdentity(sample), workload)
      )
        throw new Error(
          'Calibration host/workload identity changed across runs.',
        );
      for (const phase of phases) {
        const minimum =
          phase === 'steady'
            ? sample.counts.measuredFrames
            : sample.counts.loadStageFrames;
        const wallMinimum =
          (phase === 'steady'
            ? sample.regressionSettings.minimumSteadySeconds
            : sample.regressionSettings.minimumLoadingSeconds) * 1000;
        if (
          sample.stages[phase].cpuFrameWorkMs.count < minimum ||
          sample.stageWallMs[phase] < wallMinimum
        )
          throw new Error(
            'Calibration phase has insufficient samples or duration.',
          );
      }
    }
    bounds[kind] = {};
    observations[kind] = {};
    for (const phase of phases) {
      const values = samples.map((sample) => phaseMetrics(sample, phase));
      if (
        values.some((value) =>
          Object.values(value).some((metric) => !finite(metric)),
        )
      )
        throw new Error('Calibration has unavailable/overflowed metrics.');
      observations[kind][phase] = values;
      bounds[kind][phase] = Object.fromEntries(
        Object.keys(metrics).map((metric) => {
          const maximum = Math.max(...values.map((value) => value[metric]));
          const bound =
            metric === 'hitchFraction'
              ? Math.min(1, maximum + defaults.hitchFractionMargin)
              : maximum * (1 + defaults.relativeMargin) +
                defaults.absoluteMarginMs;
          return [metric, Math.ceil(bound * 10000) / 10000];
        }),
      );
    }
  }
  return validateProfile({
    schema: profileSchema,
    name,
    provenance: 'calibrated',
    expected,
    workload,
    bounds,
    calibration: {
      date: new Date().toISOString(),
      runs,
      observations,
      margins: defaults,
      note: 'Calibration output is not PASS certification. Review and pin it, then execute an independent --profile run. All scheduled runs retained; no retries.',
    },
  });
}

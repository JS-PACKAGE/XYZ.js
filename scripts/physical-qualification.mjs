import { readFile, realpath } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';

export const gates = [
  'physical-mobile',
  'physical-gamepad',
  'os-ime',
  'physical-audio',
  'os-background',
  'bfcache',
  'thermal',
  'spoken-at',
  'driver-recovery',
];
export const instructions = {
  'physical-mobile':
    'Owned iOS Safari and Android native browser are separate sessions. Use an authorized secure origin, tap Canvas action, rotate the device, background and return. Capture physical model, OS/build, browser version, renderer/driver diagnostic, touch/orientation/lifecycle trace and independent native screen recording. Desktop WebKit and device emulation are ineligible.',
  'physical-gamepad':
    'Connect an owned physical controller normally; record its model and firmware/mapping. Press and release a button, move and rest an axis, then disconnect. Collect raw getGamepads values alongside Game input state and native connection events, plus independent capture showing the controller and actions. Do not inject pads or change drivers.',
  'os-ime':
    'Focus Native field, use the identified OS IME/version for composition start/update/commit, start another composition and cancel it, move selection, then move focus to Canvas action. Record committed value/selection and independent OS candidate-window capture. Synthetic composition, fill and WebDriver typing are not real IME.',
  'physical-audio':
    'BLOCKED: explicit no-physical-sound boundary. Do not play audible output or change routes. Silent analyser/worklet evidence cannot certify physical audible output.',
  'os-background':
    'Record visible baseline; manually background the native browser on the actual OS for the declared duration and return. Compare scene ticks, delta and configured audio pause policy before/hidden/after with OS screen capture. CDP freeze and fabricated visibility are ineligible.',
  bfcache:
    'Use Leave for BFCache from the harness, then the browser Back control. Require trusted pagehide.persisted=true and pageshow.persisted=true from the SAME document/session, live Game and rendered pixels after return. A reload, false persisted flag or synthetic event is not BFCache. Capture the native history round trip.',
  thermal:
    'Run the linked real production workload for a declared duration, capturing baseline/sustained/recovery workload results and existing read-only temperature or OS thermal-pressure telemetry with source/unit/time and power state. No forced heat, cooling or power changes. Browser timings alone are not thermal measurements.',
  'spoken-at':
    'BLOCKED: spoken output would cross the current no-physical-sound boundary. With separately authorized future silent external evidence capture, identify AT/product/version and record exact role/name/value/focus announcements, text editing and Canvas action activation; DOM accessibility snapshots are not spoken AT evidence. This tool does not enable AT or sound.',
  'driver-recovery':
    'Observe a naturally occurring event, or a separately authorized disposable lab event. Tool NEVER resets a driver. Require native OS/driver diagnostics establishing the event, Game graphicslost/recovered/error timeline, actual recovered rendered pixels and resource state. GPUDevice.destroy and WEBGL_lose_context are API-loss evidence only.',
};
export const attestationStatement =
  'I attest that this session used the identified owned physical device and native browser, with authorization; no emulation, injected input, synthetic events, API-loss simulation or automated interaction was used as physical evidence. I personally observed the scenarios and verified artifact authenticity. This is a human trust attestation, not cryptographic proof of physicalness.';
export const reviewStatement =
  'I independently reviewed the bound evidence and native captures, verified identity, authorization, scenario outcomes and absence of synthetic substitution, and accept only this device/browser/OS/source session. This is human review, not cryptographic proof of physicalness.';
export const digest = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const date = (value) => (typeof value === 'string' ? Date.parse(value) : NaN);
const hash = (value) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const requiredEvents = {
  'physical-mobile': ['touch', 'orientation', 'hidden', 'visible-after'],
  'physical-gamepad': [
    'connected',
    'pressed',
    'released',
    'axis-active',
    'axis-rest',
    'disconnected',
    'disconnect-state',
  ],
  'os-ime': [
    'compositionstart',
    'compositionupdate',
    'commit',
    'cancel',
    'selection',
    'focus',
  ],
  'os-background': [
    'visible-before',
    'hidden',
    'visible-after',
    'resume-frame',
  ],
  bfcache: ['pagehide', 'pageshow', 'rendered-after-return'],
  thermal: ['baseline', 'sustained', 'recovery'],
  'driver-recovery': [
    'native-driver-loss',
    'graphicslost',
    'graphicsrecovered',
    'rendered-after-recovery',
  ],
};

export function prepare(gate) {
  if (!gates.includes(gate)) throw new Error('Unknown physical gate.');
  return {
    schemaVersion: 2,
    gate,
    status: 'BLOCKED',
    mode: 'physical-native',
    emulated: false,
    identity: {
      session: randomUUID(),
      operator: '',
      deviceModel: '',
      os: '',
      osBuild: '',
      browser: '',
      browserVersion: '',
      renderer: '',
      driverSource: '',
      driverVersion: '',
      identityArtifact: '',
    },
    source: { commit: '', packageVersion: '', builtEntrySha256: '' },
    authorization: {
      ownedDevice: false,
      authorizedOperator: false,
      authorizedOrigin: '',
      noSharedSessions: true,
      noDriverModification: true,
      noAudibleOutput: true,
    },
    startedAt: '',
    endedAt: '',
    durationMs: 0,
    declaredDurationMs: 0,
    artifacts: [],
    observations: [],
    scenarios: [],
    attestation: {
      operator: '',
      signedName: '',
      signedAt: '',
      statement: attestationStatement,
    },
    blocker:
      gate === 'physical-audio' || gate === 'spoken-at'
        ? 'Explicit no-physical-sound authorization boundary.'
        : 'Owned physical hardware and operator authorization/evidence are unavailable on this host.',
    instructions: instructions[gate],
  };
}

// This validates provenance consistency, not authenticity. A dishonest human can forge files.
export async function verifyEvidence(path, reviewPath) {
  const failures = [];
  const require = (condition, message) => {
    if (!condition) failures.push(message);
  };
  let evidence, bytes;
  try {
    bytes = await readFile(resolve(path));
    evidence = JSON.parse(bytes);
  } catch (error) {
    return {
      status: 'BLOCKED',
      certification: false,
      failures: [`Evidence: ${error.message}`],
    };
  }
  if (!object(evidence))
    return {
      status: 'BLOCKED',
      certification: false,
      failures: ['Evidence must be an object.'],
    };
  require(evidence.schemaVersion ===
    2, 'schemaVersion must be 2; legacy unchecked evidence cannot certify physical hardware.');
  require(gates.includes(evidence.gate), 'Unknown physical gate.');
  require(!['physical-audio', 'spoken-at'].includes(
    evidence.gate,
  ), 'Explicit no-physical-sound boundary blocks this gate.');
  require(evidence.mode === 'physical-native' &&
    evidence.emulated ===
      false, 'Only physical-native non-emulated sessions are eligible.');
  for (const field of [
    'session',
    'operator',
    'deviceModel',
    'os',
    'osBuild',
    'browser',
    'browserVersion',
    'renderer',
    'driverSource',
    'driverVersion',
    'identityArtifact',
  ])
    require(text(evidence.identity?.[field]), `Missing identity.${field}.`);
  require(typeof evidence.source?.commit === 'string' &&
    /^[a-f0-9]{40,64}$/.test(
      evidence.source.commit,
    ), 'Actual source commit required.');
  require(text(evidence.source?.packageVersion) &&
    hash(
      evidence.source?.builtEntrySha256,
    ), 'Actual package version and built entry SHA-256 required.');
  const auth = evidence.authorization;
  require(auth?.ownedDevice === true &&
    auth?.authorizedOperator === true &&
    auth?.noSharedSessions === true &&
    auth?.noDriverModification === true &&
    auth?.noAudibleOutput ===
      true, 'Explicit owned-device/operator/safety authorization required.');
  require(text(auth?.authorizedOrigin), 'Authorized origin required.');
  const start = date(evidence.startedAt),
    end = date(evidence.endedAt);
  require(Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start &&
    end <= Date.now() &&
    evidence.durationMs ===
      end -
        start, 'Actual ordered non-future session times and exact durationMs required.');
  require(Number.isFinite(evidence.declaredDurationMs) &&
    evidence.declaredDurationMs > 0 &&
    end - start >=
      evidence.declaredDurationMs, 'Session must meet its positive declared duration.');
  const root = await realpath(dirname(resolve(path)));
  const artifacts = new Map(),
    roles = new Set(),
    artifactHashes = new Set();
  let trace;
  for (const artifact of Array.isArray(evidence.artifacts)
    ? evidence.artifacts
    : []) {
    if (!object(artifact)) {
      failures.push('Artifact must be an object.');
      continue;
    }
    require(text(artifact.id) &&
      !artifacts.has(artifact.id), 'Artifact IDs must be unique.');
    require([
      'machine-trace',
      'native-capture',
      'os-diagnostic',
      'sensor-trace',
      'workload',
    ].includes(artifact.role), 'Unknown artifact role.');
    require(text(artifact.description) &&
      text(
        artifact.captureSource,
      ), 'Artifact description/captureSource required.');
    try {
      if (!text(artifact.path) || isAbsolute(artifact.path))
        throw new Error('Artifact path must be relative.');
      const actual = await realpath(resolve(root, artifact.path));
      const within = relative(root, actual);
      if (
        within === '..' ||
        within.startsWith(`..${sep}`) ||
        isAbsolute(within)
      )
        throw new Error(
          'Artifact must stay within evidence directory, including symlinks.',
        );
      const data = await readFile(actual);
      require(data.length > 0 &&
        hash(artifact.sha256) &&
        digest(data) ===
          artifact.sha256, `Artifact ${artifact.id} empty/hash mismatch.`);
      if (artifact.role === 'native-capture') {
        const png = data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
        const jpeg = data.subarray(0, 3).toString('hex') === 'ffd8ff';
        const webm = data.subarray(0, 4).toString('hex') === '1a45dfa3';
        const isoMedia = data.subarray(4, 8).toString() === 'ftyp';
        require(data.length > 24 &&
          (png ||
            jpeg ||
            webm ||
            isoMedia), 'Native capture must be actual PNG/JPEG/WebM/ISO-media bytes, not a text pass assertion.');
      }
      require(!artifactHashes.has(
        artifact.sha256,
      ), 'Distinct artifacts must not reuse identical bytes.');
      artifactHashes.add(artifact.sha256);
      artifacts.set(artifact.id, artifact);
      roles.add(artifact.role);
      if (artifact.role === 'machine-trace') {
        require(!trace, 'Exactly one collector machine trace required.');
        trace = JSON.parse(data);
      }
    } catch (error) {
      failures.push(`Artifact ${artifact.id}: ${error.message}`);
    }
  }
  require(roles.has('machine-trace') &&
    roles.has('native-capture') &&
    roles.has(
      'os-diagnostic',
    ), 'Require collector trace, independent native capture and identity OS diagnostic artifacts.');
  require(artifacts.get(evidence.identity?.identityArtifact)?.role ===
    'os-diagnostic', 'identityArtifact must reference the OS identity diagnostic.');
  require(trace?.schemaVersion === 2 &&
    trace?.kind === 'xyz-physical-interaction-trace' &&
    trace?.certification ===
      false, 'Actual qualification collector trace required; report/pass checkboxes are ineligible.');
  require(trace?.session === evidence.identity?.session &&
    trace?.source?.commit === evidence.source?.commit &&
    trace?.source?.packageVersion === evidence.source?.packageVersion &&
    trace?.source?.builtEntrySha256 ===
      evidence.source
        ?.builtEntrySha256, 'Collector session and source identity must match evidence.');
  require(trace?.environment?.origin === auth?.authorizedOrigin &&
    trace?.environment?.secureContext === true &&
    text(
      trace?.environment?.userAgent,
    ), 'Secure native browser environment must match authorized origin.');
  require(trace?.collectionMode === 'operator-interaction-unverified' &&
    trace?.environment?.webdriver ===
      false, 'Known browser automation is ineligible; webdriver=false still is not proof of physicalness.');
  require(trace?.truncated ===
    false, 'Truncated collector traces cannot qualify.');
  require(date(trace?.startedAt) === start &&
    date(trace?.endedAt) === end, 'Collector must bound the complete session.');
  const samples = Array.isArray(trace?.samples) ? trace.samples : [];
  const sampleIds = new Map();
  let last = start;
  for (const sample of samples) {
    if (!object(sample)) {
      failures.push('Trace sample must be an object.');
      continue;
    }
    const time = date(sample.at);
    require(Number.isInteger(sample.sequence) &&
      !sampleIds.has(
        sample.sequence,
      ), 'Unique integer trace sequences required.');
    require(Number.isFinite(time) &&
      time >= last &&
      time <= end, 'Trace samples must be ordered within the session.');
    last = time;
    require(object(sample.value), 'Trace samples need measured value objects.');
    require([
      'native-event',
      'browser-poll',
      'engine-event',
      'operator-observation',
      'measurement',
    ].includes(sample.source), 'Unknown trace source.');
    if (sample.source === 'native-event')
      require(sample.trusted ===
        true, 'Synthetic/untrusted native events cannot qualify physical evidence.');
    sampleIds.set(sample.sequence, sample);
  }
  const seen = new Set();
  for (const observation of Array.isArray(evidence.observations)
    ? evidence.observations
    : []) {
    if (!object(observation)) {
      failures.push('Observation must be an object.');
      continue;
    }
    const sample = sampleIds.get(observation.sequence);
    require(!!sample &&
      sample.event ===
        observation.event, `Observation ${observation.event} must reference its collector sample.`);
    require(artifacts.get(observation.captureArtifact)?.role ===
      'native-capture' &&
      text(
        observation.captureLocator,
      ), 'Each observation requires independent native capture and time/frame locator.');
    if (sample) {
      validateSample(evidence.gate, sample, require);
      seen.add(sample.event);
      if (evidence.gate === 'thermal')
        require(artifacts.get(sample.value?.workloadArtifact)?.role ===
          'workload' &&
          artifacts.get(sample.value?.sensorArtifact)?.role ===
            'sensor-trace', 'Thermal observations must bind actual workload and sensor artifacts.');
      if (sample.event === 'native-driver-loss')
        require(artifacts.get(sample.value?.diagnosticArtifact)?.role ===
          'os-diagnostic', 'Driver event must reference OS diagnostic artifact.');
    }
  }
  for (const event of requiredEvents[evidence.gate] ?? [])
    require(seen.has(event), `Missing actual scenario event: ${event}.`);
  const observed = (name) =>
    (Array.isArray(evidence.observations) ? evidence.observations : [])
      .filter((item) => item?.event === name)
      .map((item) => sampleIds.get(item.sequence))
      .filter(Boolean);
  const ordered = (...names) => {
    let sequence = -1;
    for (const name of names) {
      const next = observed(name).find((sample) => sample.sequence > sequence);
      require(!!next, `Measured transition order missing: ${names.join(' → ')}.`);
      if (next) sequence = next.sequence;
    }
  };
  if (evidence.gate === 'physical-gamepad') {
    ordered(
      'connected',
      'pressed',
      'released',
      'disconnected',
      'disconnect-state',
    );
    ordered('connected', 'axis-active', 'axis-rest', 'disconnected');
  }
  if (evidence.gate === 'os-ime')
    ordered(
      'compositionstart',
      'compositionupdate',
      'commit',
      'cancel',
      'selection',
      'focus',
    );
  if (['physical-mobile', 'os-background'].includes(evidence.gate))
    ordered('hidden', 'visible-after');
  if (evidence.gate === 'os-background') {
    ordered('visible-before', 'hidden', 'visible-after', 'resume-frame');
    const hidden = observed('hidden')[0],
      visible = observed('visible-after')[0],
      resumed = observed('resume-frame')[0];
    require(date(visible?.at) - date(hidden?.at) >=
      evidence.declaredDurationMs, 'Actual hidden interval must meet declared duration.');
    require(resumed?.value?.delta === 0 &&
      resumed?.value?.gameState === 'running' &&
      resumed?.value?.ticks > hidden?.value?.ticks &&
      resumed?.value?.ticks <=
        hidden?.value?.ticks +
          2, 'Background return must advance from suspended ticks with zero first-frame delta.');
  }
  if (evidence.gate === 'bfcache') {
    ordered('pagehide', 'pageshow', 'rendered-after-return');
    const hidden = observed('pagehide')[0],
      shown = observed('pageshow')[0];
    require(hidden?.value?.documentId === trace?.documentId &&
      shown?.value?.documentId === trace?.documentId &&
      text(
        trace?.documentId,
      ), 'BFCache must return the original collector document, not a reload.');
  }
  if (evidence.gate === 'thermal') {
    ordered('baseline', 'sustained', 'recovery');
    require(date(observed('sustained')[0]?.at) -
      date(observed('baseline')[0]?.at) >=
      evidence.declaredDurationMs, 'Measured sustained thermal interval must meet declared duration.');
  }
  if (evidence.gate === 'driver-recovery')
    ordered(
      'native-driver-loss',
      'graphicslost',
      'graphicsrecovered',
      'rendered-after-recovery',
    );
  const scenarios = Array.isArray(evidence.scenarios) ? evidence.scenarios : [];
  require(scenarios.length > 0, 'Per-scenario measured outcomes required.');
  const scenarioEvents = new Set();
  const scenarioIds = new Set();
  for (const scenario of scenarios) {
    require(object(scenario) &&
      text(scenario.id) &&
      text(scenario.expected) &&
      text(scenario.observed) &&
      scenario.outcome ===
        'PASS', 'Scenario needs ID, expected/observed behavior and explicit PASS outcome.');
    require(text(scenario?.id) &&
      !scenarioIds.has(scenario?.id), 'Scenario IDs must be unique.');
    scenarioIds.add(scenario?.id);
    const from = date(scenario?.startedAt),
      to = date(scenario?.endedAt);
    require(from >= start &&
      to <= end &&
      to > from &&
      scenario?.durationMs ===
        to -
          from, 'Each scenario needs ordered times and exact duration within session.');
    require(Array.isArray(scenario?.events) &&
      scenario.events.length > 0 &&
      scenario.events.every((event) =>
        seen.has(event),
      ), 'Scenario must bind actual observed events.');
    for (const event of Array.isArray(scenario?.events)
      ? scenario.events
      : []) {
      scenarioEvents.add(event);
      require(observed(event).some(
        (sample) => date(sample.at) >= from && date(sample.at) <= to,
      ), 'Bound scenario events must occur within scenario times.');
    }
  }
  for (const event of requiredEvents[evidence.gate] ?? [])
    require(scenarioEvents.has(
      event,
    ), `No reviewed scenario outcome for ${event}.`);
  if (evidence.gate === 'thermal')
    require(roles.has('sensor-trace') &&
      roles.has(
        'workload',
      ), 'Thermal needs native sensor trace and real workload artifacts.');
  if (evidence.gate === 'physical-mobile')
    require(/iOS|iPadOS|Android/i.test(
      evidence.identity?.os ?? '',
    ), 'Mobile qualification requires actual iOS/iPadOS/Android identity.');
  if (evidence.gate === 'physical-gamepad')
    require(text(evidence.controller?.model) &&
      text(evidence.controller?.firmware) &&
      text(
        evidence.controller?.mapping,
      ), 'Controller model, firmware source/version and mapping required.');
  if (evidence.gate === 'os-ime')
    require(text(evidence.ime?.name) &&
      text(evidence.ime?.version) &&
      text(evidence.ime?.locale), 'OS IME name/version/locale required.');
  const attestation = evidence.attestation;
  require(attestation?.operator === evidence.identity?.operator &&
    text(attestation?.signedName) &&
    date(attestation?.signedAt) >= end &&
    date(attestation?.signedAt) <= Date.now() &&
    attestation?.statement ===
      attestationStatement, 'Explicit signed-name operator attestation required after session.');
  let accepted = false;
  if (reviewPath) {
    try {
      const review = JSON.parse(await readFile(resolve(reviewPath), 'utf8'));
      require(review.schemaVersion === 2 &&
        review.evidenceSha256 ===
          digest(bytes), 'Review must bind exact evidence bytes.');
      require(text(review.reviewer) &&
        review.reviewer !== evidence.identity?.operator &&
        text(review.signedName) &&
        date(review.signedAt) >= date(attestation?.signedAt) &&
        date(review.signedAt) <=
          Date.now(), 'Independent named reviewer and ordered explicit signature required.');
      require(review.statement === reviewStatement &&
        review.decision === 'ACCEPT' &&
        text(
          review.notes,
        ), 'Explicit independent acceptance, statement and review notes required.');
      accepted = failures.length === 0;
    } catch (error) {
      failures.push(`Review: ${error.message}`);
    }
  }
  return {
    schemaVersion: 2,
    gate: evidence.gate,
    status: failures.length
      ? 'BLOCKED'
      : accepted
        ? 'PHYSICAL-PASS-HUMAN-ATTESTED'
        : 'EVIDENCE-READY-FOR-REVIEW',
    certification: accepted ? 'human-attestation-only' : false,
    evidenceSha256: digest(bytes),
    failures,
    reason:
      'Hashes bind reviewed bytes, not physical authenticity. isTrusted also occurs in browser automation. Physical acceptance requires honest independent human review; this tool cannot cryptographically prove physicalness.',
    instructions: instructions[evidence.gate],
  };
}

function validateSample(gate, sample, require) {
  const v = sample.value;
  if (!text(sample.event)) {
    require(false, 'Trace event must be a string.');
    return;
  }
  if (!object(v)) return;
  const native = () =>
    require(sample.source === 'native-event' &&
      sample.trusted ===
        true, `${sample.event} requires a trusted native event (not sufficient by itself).`);
  if (
    [
      'touch',
      'orientation',
      'hidden',
      'visible-before',
      'visible-after',
      'pagehide',
      'pageshow',
      'compositionstart',
      'compositionupdate',
      'commit',
      'cancel',
      'selection',
      'focus',
      'connected',
      'disconnected',
    ].includes(sample.event)
  )
    native();
  if (sample.event === 'touch')
    require(v.pointerType === 'touch' &&
      Number.isFinite(v.x) &&
      Number.isFinite(v.y), 'Actual touch coordinates required.');
  if (sample.event === 'orientation')
    require(Number.isFinite(v.angle) &&
      Number.isFinite(v.width) &&
      Number.isFinite(v.height), 'Actual orientation/viewport required.');
  if (['hidden', 'visible-before', 'visible-after'].includes(sample.event))
    require(v.visibility ===
      (sample.event === 'hidden' ? 'hidden' : 'visible') &&
      Number.isFinite(v.ticks) &&
      Number.isFinite(v.delta) &&
      typeof v.audioPaused ===
        'boolean', 'Visibility requires actual lifecycle/input clock/audio state.');
  if (gate === 'bfcache' && ['pagehide', 'pageshow'].includes(sample.event))
    require(v.persisted === true &&
      text(
        v.documentId,
      ), 'Actual persisted BFCache same-document transition required.');
  if (sample.event.startsWith('rendered-after-'))
    require(sample.source === 'measurement' &&
      hash(v.pixelSha256) &&
      text(v.png) &&
      v.gameState === 'running', 'Actual rendered frame measurement required.');
  if (
    gate === 'physical-gamepad' &&
    ['pressed', 'released', 'axis-active', 'axis-rest'].includes(sample.event)
  ) {
    require(sample.source === 'browser-poll' &&
      text(v.id) &&
      Array.isArray(v.buttons) &&
      Array.isArray(v.axes) &&
      object(
        v.engine,
      ), 'Gamepad requires native polling and corresponding engine snapshot.');
    if (sample.event === 'pressed')
      require(Array.isArray(v.buttons) &&
        v.buttons.some(
          (button) => button?.pressed === true && button.value > 0,
        ) &&
        Object.values(v.engine?.buttons ?? {}).some(
          (value) => value > 0,
        ), 'Pressed sample requires native and engine button state.');
    if (sample.event === 'released')
      require(Array.isArray(v.buttons) &&
        v.buttons.length > 0 &&
        v.buttons.every((button) => button?.pressed === false) &&
        Object.values(v.engine?.buttons ?? {}).every(
          (value) => value === 0,
        ), 'Released sample requires native and engine released buttons.');
    if (sample.event === 'axis-active')
      require(Array.isArray(v.axes) &&
        v.axes.some((axis) => Number.isFinite(axis) && Math.abs(axis) > 0.2) &&
        Object.values(v.engine?.axes ?? {}).some(
          (value) => Math.abs(value) > 0,
        ), 'Axis-active needs native and engine measured motion.');
    if (sample.event === 'axis-rest')
      require(Array.isArray(v.axes) &&
        v.axes.length > 0 &&
        v.axes.every(
          (axis) => Number.isFinite(axis) && Math.abs(axis) <= 0.2,
        ) &&
        Object.values(v.engine?.axes ?? {}).every(
          (value) => Math.abs(value) <= 0.2,
        ), 'Axis-rest needs native and engine measured rest.');
  }
  if (sample.event === 'disconnect-state')
    require(sample.source === 'browser-poll' &&
      v.nativeConnected === false &&
      v.engine?.connected ===
        false, 'Disconnect must reach both native polling and Game input state.');
  if (gate === 'os-ime')
    require(typeof v.value === 'string' &&
      Array.isArray(v.selection) &&
      v.selection.length ===
        2, 'IME requires committed text/native selection measurements.');
  if (gate === 'thermal')
    require(sample.source === 'operator-observation' &&
      text(v.sensorSource) &&
      text(v.unit) &&
      (Number.isFinite(v.temperature) || text(v.thermalPressure)) &&
      text(v.powerState) &&
      text(
        v.workloadArtifact,
      ), 'Thermal requires actual native telemetry/source/unit/power/workload reference; no browser-only inference.');
  if (sample.event === 'native-driver-loss')
    require(sample.source === 'operator-observation' &&
      text(v.diagnosticArtifact) &&
      text(v.diagnosticLocator) &&
      v.apiSimulation ===
        false, 'Native driver event requires diagnostic reference, not API loss.');
  if (['graphicslost', 'graphicsrecovered'].includes(sample.event))
    require(sample.source === 'engine-event' &&
      text(v.backend), 'Actual Game graphics lifecycle event required.');
}

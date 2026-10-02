import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { release, platform, arch } from 'node:os';
import process from 'node:process';
import console from 'node:console';
const execute = promisify(execFile);
const gates = [
  'physical-mobile',
  'physical-gamepad',
  'os-ime',
  'physical-audio',
  'os-background',
  'thermal',
  'driver-recovery',
];
const instructions = {
  'physical-mobile':
    'Use an owned physical device, native installed browser and a secure test origin. Run the real Game platform probe and production workload. Record model, OS/build, browser version, native GPU/driver source, trusted touch traces, rotate/resume behavior, screenshot and workload JSON. Device emulation and managed desktop WebKit are not mobile/Safari evidence.',
  'physical-gamepad':
    'Connect an owned physical controller normally (no driver changes). In the actual Game input surface record controller identity/mapping, trusted connection/disconnection, raw native getGamepads axes/buttons at rest, press, release and disconnect, plus corresponding game input state. Capture screen/video showing controller actions; no injected pads.',
  'os-ime':
    'In the actual Game native text field use a real OS IME to begin composition, update, commit and cancel, then move selection/focus. Record trusted composition/native input traces and committed text/selection plus screen capture. dispatchEvent and fill are not OS IME proof.',
  'physical-audio':
    'BLOCKED by the explicit no-sound instruction. Do not execute audible playback or change OS routes. Owned browser automation must use --mute-audio and a native zero-gain physical destination safety sink before unlock/play; analyser-only observations remain silent and cannot certify audible output. A physical recording scenario requires separate future authorization.',
  'os-background':
    'Manually background then foreground the owned native browser on its physical OS. Record trusted visibility/pagehide/pageshow events, scene ticks/frame delta and configured audio pause policy before/during/after, with OS screen recording. CDP freeze/emulated visibility is not OS suspension evidence.',
  thermal:
    'Run the real fixed-count workload on an owned physical device for an operator-declared duration. Read existing non-invasive sensor/thermal telemetry and collect workload stages before/during/after. Record sensor source/unit/timestamps and temperature or explicit OS thermal pressure, power state and device identity. Do not force heat, power modes or cooling; headless timing alone is not thermal evidence.',
  'driver-recovery':
    'Never execute a driver reset from this tool. Observe only a naturally occurring loss or an independently authorized safe lab procedure on an owned disposable environment. Capture native OS/driver diagnostic proving the real driver event, loss/recovery/error timeline, rebuilt Game rendered pixels and released resources. GPUDevice.destroy/WEBGL_lose_context are API-loss tests, not true driver reset. Without an actual event this gate is BLOCKED.',
};

async function inventory() {
  const facts = [];
  const command = async (file, args, select) => {
    try {
      const { stdout } = await execute(file, args, {
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
      });
      facts.push({
        command: [file, ...args],
        status: 'available',
        value: select ? select(stdout) : stdout.trim(),
      });
    } catch (error) {
      facts.push({
        command: [file, ...args],
        status: 'blocked',
        reason: String(error.message),
      });
    }
  };
  if (platform() === 'darwin') {
    await command('/usr/bin/sw_vers', []);
    await command(
      '/usr/sbin/system_profiler',
      ['SPHardwareDataType', 'SPDisplaysDataType', 'SPAudioDataType', '-json'],
      (text) => {
        const data = JSON.parse(text);
        // Deliberately omit host name, serial numbers, UUIDs and network addresses.
        return {
          hardware: (data.SPHardwareDataType ?? []).map((item) => ({
            model: item.machine_model,
            modelName: item.machine_name,
            chip: item.chip_type,
            memory: item.physical_memory,
          })),
          graphics: (data.SPDisplaysDataType ?? []).map((item) => ({
            model: item.sppci_model,
            vendor: item.spdisplays_vendor,
            metal: item.spdisplays_metal,
            driverVersion: item.spdisplays_driver_version ?? null,
          })),
          audio: (data.SPAudioDataType ?? [])
            .flatMap((item) => item._items ?? [])
            .map((item) => ({
              device: item._name,
              manufacturer: item.coreaudio_device_manufacturer,
              transport: item.coreaudio_device_transport,
              output: item.coreaudio_device_output,
              input: item.coreaudio_device_input,
            })),
        };
      },
    );
    await command(
      '/usr/sbin/system_profiler',
      ['SPUSBDataType', 'SPBluetoothDataType', '-json'],
      (text) => {
        const devices = [];
        const visit = (value) => {
          if (Array.isArray(value)) {
            for (const item of value) visit(item);
          } else if (value && typeof value === 'object') {
            if (
              value._name &&
              (value.vendor_id || value.product_id || value.device_minorType)
            )
              devices.push({
                name: value._name,
                vendor: value.vendor_id ?? null,
                product: value.product_id ?? null,
                type: value.device_minorType ?? null,
              });
            for (const item of Object.values(value))
              if (typeof item === 'object') visit(item);
          }
        };
        visit(JSON.parse(text));
        return {
          devices,
          scope:
            'Read-only connected-device metadata; no controller input or physical ownership proof. Serial numbers and addresses omitted.',
        };
      },
    );
    await command('/usr/bin/pmset', ['-g', 'therm']);
    await command('/usr/bin/defaults', [
      'read',
      'com.apple.HIToolbox',
      'AppleSelectedInputSources',
    ]);
    await command('/usr/bin/xcrun', ['simctl', 'list', 'devices', 'available']);
    await command('/usr/bin/which', ['adb']);
  }
  return {
    schemaVersion: 1,
    session: randomUUID(),
    date: new Date().toISOString(),
    host: { os: platform(), release: release(), arch: arch() },
    facts,
    gates: gates.map((gate) => ({
      gate,
      status: 'BLOCKED',
      reason:
        gate === 'driver-recovery'
          ? 'No naturally occurring driver loss evidence; destructive reset is prohibited.'
          : gate === 'physical-audio'
            ? 'User explicitly prohibits sound; physical audible-output verification must not execute.'
            : 'Inventory is capability metadata only; no owned physical scenario evidence has been exercised.',
      instructions: instructions[gate],
    })),
    safety:
      'Read-only fact commands. No browser/OS/device/driver intervention, Safari access or synthetic certification.',
  };
}

async function verify(path) {
  const evidence = JSON.parse(await readFile(resolve(path), 'utf8'));
  const failures = [];
  const require = (condition, reason) => {
    if (!condition) failures.push(reason);
  };
  require(evidence.schemaVersion === 1, 'schemaVersion must be 1.');
  require(gates.includes(evidence.gate), 'Unknown native gate.');
  require(evidence.gate !==
    'physical-audio', 'Physical audible-output gate is blocked by the explicit no-sound instruction.');
  require(evidence.mode === 'physical-native' &&
    evidence.emulated ===
      false, 'Only non-emulated physical-native evidence is eligible.');
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
  ])
    require(typeof evidence.identity?.[field] === 'string' &&
      evidence.identity[field].trim().length >
        0, `Missing actual identity.${field}.`);
  const start = Date.parse(evidence.startedAt),
    end = Date.parse(evidence.endedAt);
  require(Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start, 'Actual ordered session start/end required.');
  const artifacts = evidence.artifacts ?? [];
  require(Array.isArray(artifacts) &&
    artifacts.length >=
      2, 'Require machine trace/measurement and independent native capture artifacts.');
  const roles = new Set();
  for (const artifact of Array.isArray(artifacts) ? artifacts : []) {
    try {
      const bytes = await readFile(
        resolve(dirname(resolve(path)), artifact.path),
      );
      require(bytes.byteLength > 0 &&
        createHash('sha256').update(bytes).digest('hex') ===
          artifact.sha256, `Artifact ${artifact.path} missing/empty/hash mismatch.`);
      require([
        'machine-trace',
        'native-capture',
        'os-diagnostic',
        'sensor-trace',
        'workload',
      ].includes(artifact.role), 'Unknown artifact role.');
      roles.add(artifact.role);
    } catch (error) {
      failures.push(`Artifact ${artifact.path}: ${error.message}`);
    }
  }
  require(roles.has('machine-trace') &&
    roles.has(
      'native-capture',
    ), 'Require both machine-trace and native-capture roles.');
  const samples = evidence.observations;
  require(Array.isArray(samples) &&
    samples.length >=
      2, 'Actual before/after native observations required, not a pass checkbox.');
  let last = start;
  for (const sample of Array.isArray(samples) ? samples : []) {
    const time = Date.parse(sample.at);
    require(Number.isFinite(time) &&
      time >= last &&
      time <= end, 'Observation timestamps must be ordered within session.');
    last = time;
    require(sample.source === 'native' &&
      sample.trusted === true &&
      typeof sample.value === 'object' &&
      sample.value !== null &&
      Object.keys(sample.value).length >
        0, 'Each observation needs trusted native source and actual measured value object.');
  }
  const events = new Set(
    (Array.isArray(samples) ? samples : []).map((sample) => sample.event),
  );
  const required =
    {
      'physical-mobile': ['touch', 'orientation', 'resume'],
      'physical-gamepad': ['connected', 'pressed', 'released', 'disconnected'],
      'os-ime': ['compositionstart', 'compositionupdate', 'commit', 'cancel'],
      'physical-audio': ['unlock', 'audible', 'pause', 'resume'],
      'os-background': ['visible-before', 'hidden', 'visible-after'],
      thermal: ['baseline', 'sustained', 'recovery'],
      'driver-recovery': [
        'native-driver-loss',
        'graphicslost',
        'graphicsrecovered',
        'rendered-after-recovery',
      ],
    }[evidence.gate] ?? [];
  for (const event of required)
    require(events.has(event), `Missing native scenario event: ${event}.`);
  if (evidence.gate === 'driver-recovery')
    require(roles.has(
      'os-diagnostic',
    ), 'True driver event requires native OS/driver diagnostic; API device destruction is not proof.');
  if (evidence.gate === 'thermal')
    require(roles.has('sensor-trace') &&
      roles.has(
        'workload',
      ), 'Thermal proof requires sensor trace and real workload artifacts.');
  // Human-observed physical identity/capture authenticity is intentionally not machine-certifiable.
  return {
    gate: evidence.gate,
    status: failures.length ? 'BLOCKED' : 'EVIDENCE-READY-FOR-REVIEW',
    failures,
    certification: false,
    reason:
      'No form or arbitrary JSON can auto-pass native hardware. Independently review artifact authenticity, actual identity and measured behavior against the named scenario before recording acceptance.',
    instructions: instructions[evidence.gate],
  };
}

const [mode = '--inventory', path = '.vite/platform-hardware.json', extra] =
  process.argv.slice(2);
if (extra || !['--inventory', '--verify', '--instructions'].includes(mode))
  throw new Error(
    'Usage: node scripts/platform-hardware.mjs --inventory [output.json] | --verify evidence.json | --instructions',
  );
const result =
  mode === '--instructions'
    ? {
        schemaVersion: 1,
        instructions,
        evidenceShape: {
          schemaVersion: 1,
          gate: 'one named gate',
          mode: 'physical-native',
          emulated: false,
          identity: {
            session: 'actual-session',
            operator: 'responsible-owner',
            deviceModel: 'actual-model',
            os: 'actual-OS',
            osBuild: 'actual-build',
            browser: 'actual-native-browser',
            browserVersion: 'actual-version',
            renderer: 'actual-backend',
            driverSource: 'native-diagnostic-source',
            driverVersion: 'actual-version',
          },
          startedAt: 'ISO-time',
          endedAt: 'ISO-time',
          artifacts: [
            {
              path: 'relative-existing-file',
              sha256: 'actual-sha256',
              role: 'machine-trace',
            },
            {
              path: 'relative-existing-capture',
              sha256: 'actual-sha256',
              role: 'native-capture',
            },
          ],
          observations: [
            {
              at: 'ISO-time',
              source: 'native',
              trusted: true,
              event: 'scenario-event',
              value: { measured: 'actual-value' },
            },
          ],
        },
        status: 'INSTRUCTIONS-ONLY',
        certification: false,
      }
    : mode === '--verify'
      ? await verify(path)
      : await inventory();
if (mode === '--inventory') {
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(resolve(path), `${JSON.stringify(result, null, 2)}\n`);
}
console.log(JSON.stringify(result, null, 2));
if (mode === '--verify' && result.status === 'BLOCKED') process.exitCode = 1;

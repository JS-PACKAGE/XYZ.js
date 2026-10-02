import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { release, platform, arch } from 'node:os';
import process from 'node:process';
import console from 'node:console';
const execute = promisify(execFile);
import {
  gates,
  instructions,
  prepare,
  verifyEvidence,
  reviewStatement,
} from './physical-qualification.mjs';

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
    // Never start device bridges or simulator services just to discover inventory.
    await command('/usr/bin/defaults', [
      'read',
      '/Applications/Safari.app/Contents/Info',
      'CFBundleShortVersionString',
    ]);
    await command('/usr/bin/defaults', [
      'read',
      '/Applications/Safari.app/Contents/Info',
      'CFBundleVersion',
    ]);
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

const [mode = '--inventory', path = '.vite/platform-hardware.json', extra] =
  process.argv.slice(2);
if (process.argv.slice(2).length > 3)
  throw new Error('Unexpected extra arguments.');
if (
  !['--inventory', '--verify', '--prepare', '--instructions'].includes(mode) ||
  (extra && mode !== '--verify' && mode !== '--prepare')
)
  throw new Error(
    'Usage: node scripts/platform-hardware.mjs --inventory [output.json] | --prepare gate output.json | --verify evidence.json [review.json] | --instructions',
  );
const result =
  mode === '--instructions'
    ? {
        schemaVersion: 2,
        instructions,
        gates,
        reviewShape: {
          schemaVersion: 2,
          evidenceSha256: 'exact-evidence-file-sha256',
          reviewer: 'independent-reviewer',
          signedName: 'explicit-signature',
          signedAt: 'ISO-time-after-attestation',
          statement: reviewStatement,
          decision: 'ACCEPT',
          notes: 'artifact authenticity, identity and scenario outcome review',
        },
        status: 'INSTRUCTIONS-ONLY',
        certification: false,
      }
    : mode === '--verify'
      ? await verifyEvidence(path, extra)
      : mode === '--prepare'
        ? prepare(path)
        : await inventory();
if (mode === '--inventory' || mode === '--prepare') {
  const target = resolve(
    mode === '--prepare'
      ? (extra ?? `.vite/physical/${path}/evidence.json`)
      : path,
  );
  await mkdir(dirname(target), { recursive: true });
  // Reports must not overwrite existing evidence.
  await writeFile(target, `${JSON.stringify(result, null, 2)}\n`, {
    flag: 'wx',
  });
}
console.log(JSON.stringify(result, null, 2));
if (mode === '--verify' && result.status === 'BLOCKED') process.exitCode = 1;

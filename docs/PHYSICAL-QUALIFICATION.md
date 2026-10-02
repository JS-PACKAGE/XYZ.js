# Owned physical qualification protocol

This protocol is separate from managed desktop/browser automation. **No physical device or authorization evidence is available on the current host. All physical gates remain BLOCKED.** These are unavailable hardware/authorization/actual-event prerequisites, not claims that the collection tools are unimplemented.

No command here pairs devices, enables USB debugging/Remote Automation, adopts shared Safari sessions, changes OS/drivers, forces heat, resets drivers or plays physical sound. Browser `isTrusted` and `navigator.webdriver === false` are **not proof of physicalness**. Hashes bind bytes; explicit signed names are human attestations, not cryptographic identity signatures or proof that a device is physical. A dishonest operator/reviewer can forge evidence. Never accept synthetic or managed-engine evidence as physical evidence.

## Safe host commands

Run from repository root. Output creation refuses to overwrite existing evidence; choose a new output path if one exists.

```sh
node scripts/platform-hardware.mjs --inventory .vite/physical-owned-inventory.json
node scripts/platform-hardware.mjs --instructions
node scripts/physical-negative-smoke.mjs
node scripts/platform-hardware.mjs --prepare bfcache .vite/physical-session/evidence.json
node scripts/platform-hardware.mjs --verify .vite/physical-session/evidence.json
```

Inventory uses existing read-only macOS hardware/display/audio/USB/Bluetooth metadata, selected input-source settings, thermal-pressure metadata, installed Safari application version and `which adb`. It omits serials/UUIDs/network addresses. It never runs adb, simctl, a device bridge, Safari, a sensor-control tool or browser automation. Inventory facts do not establish ownership or exercise scenarios. The final command exits 1 with named BLOCKED failures until real evidence is supplied. Negative smoke uses disposable temporary JSON, prints every gate as BLOCKED and removes only its own temporary files.

Parent-side regression command (not physical certification):

```sh
pnpm exec vitest run tests/physical-qualification.test.mjs
```

The fixtures in that suite are fabricated test data. In particular, its human-review acceptance fixture tests the trust-boundary contract, not hardware authenticity.

## Serve the real built-root interaction surface

After the parent builds the engine:

```sh
node scripts/platform-manual.mjs --host 127.0.0.1 --port 5210
```

Open the printed URL only in an owned authorized environment:
`http://127.0.0.1:5210/tests/browser/platform.html?renderer=canvas2d&physical=1`.
Use explicit `webgl2` or `webgpu` only where the native device supports them; forced backend failure is not silently downgraded. Desktop interaction is not mobile qualification.

The server opens no browser. The `physical=1` surface disables audio unlock and records actual touch coordinates, orientation/viewport, native text/IME/selection/focus, raw controller values alongside Game input values, visibility/first-return-frame clock/ticks/audio pause state, persisted history transitions, Game graphics lifecycle events and actual rendered frame PNG/pixel digest. Operator-entered native thermal/driver/AT observations are explicitly labeled `operator-observation`, never trusted browser measurements. Input/IME text is captured: use test text, never credentials. Session trace is bounded at 20,000 samples; truncation blocks acceptance.

The source endpoint `/__xyz/qualification-source` reports the checked-out commit, actual package version and SHA-256 of the served built entry. Keep the exact build/source used; the commit alone is not proof of an unmodified build. The collector binds all three fields and a prepared session UUID. The collector cannot discover physical ownership, OS build, native browser version, driver identity, controller firmware, actual thermal sensors or spoken announcements; obtain those from identified native sources and independent capture.

For an externally owned iOS/Android device, an operator must first arrange an **already-authorized trusted secure test origin**. Do not arrange pairing, forwarding, network exposure or certificate trust changes without separate authorization. Explicit non-loopback serving requires existing authorized TLS material and an authorization file:

```sh
node scripts/platform-manual.mjs --host owned-test-host.example --port 5210 \
  --authorization /owned-test/network-authorization.json \
  --tls-cert /owned-test/existing-certificate.pem --tls-key /owned-test/existing-private-key.pem
```

Do not commit TLS keys or authorization records. The authorization shape is:

```json
{
  "schemaVersion": 1,
  "scope": "physical-harness-network",
  "origin": "https://owned-test-host.example:5210",
  "ownedEnvironment": true,
  "isolatedSession": true,
  "noAudibleOutput": true,
  "operator": "actual-responsible-operator",
  "signedName": "actual-explicit-signature",
  "signedAt": "actual-ISO-time",
  "statement": "I authorize only this owned isolated test environment and operator for the stated scope and origin. No shared Safari sessions, device pairing, driver/OS changes, external production access or audible sound are authorized."
}
```

These authorization fields are a human trust boundary, not machine proof. On the current host, absent authorization means **do not run external serving**. Non-loopback HTTP is rejected. Existing certificates must already be trusted by the actual device; the tool never changes trust stores.

## Capture and bind a session

1. Prepare one named gate per device/browser/OS/backend session with `--prepare`. Never replace the generated session UUID or certify multiple native platforms from one desktop session.
2. Identify the physical model, actual OS/build and browser version from native sources. Capture independent native diagnostic evidence for renderer/driver source/version; if the driver is OS-integrated, identify its actual OS build and native source. Missing version/identity is a named BLOCKED prerequisite, not a guessed value.
3. Begin independent native screen/controller/OS capture. Paste the prepared UUID into the collector and click **Start measured session**. The origin must be secure and authorized. Do not use automation, dispatchEvent, injected gamepads or API-loss hooks.
4. Perform the named scenarios below. For BFCache, use **Leave for BFCache**, then the **native browser Back control**. The harness preserves Game on persisted pagehide and tears down only non-persisted navigation. A reload/ordinary history fallback remains BLOCKED for BFCache. Use **Measure actual rendered frame** after the real return/recovery, and inspect the PNG against the actual content.
5. For thermal/driver native measurements, record the real diagnostic JSON through **Record operator observation**, then attach original native sensor/workload/diagnostic files. Do not infer temperature or a driver reset from browser timings/events.
6. End the session and download the trace. Copy original native captures/diagnostics/workload outputs beside evidence.json. Record actual source identity, start/end, exact duration, declared duration, and per-scenario results. Bind each observation to a trace sequence and independent capture locator.
7. Hash every artifact (`shasum -a 256 file`). Sign the prepared exact operator statement only if true. Run `--verify evidence.json`. Successful structural verification is only `EVIDENCE-READY-FOR-REVIEW` with `certification: false`.
8. An independent named reviewer checks physical identity, native authenticity, source/build identity, each outcome/measurement and all prohibitions. The reviewer signs an explicit review bound to **exact evidence file bytes**, including artifact hashes. Run `--verify evidence.json review.json`. Acceptance is deliberately labeled `PHYSICAL-PASS-HUMAN-ATTESTED`, `certification: "human-attestation-only"`; never report it as automated/cryptographically proven hardware certification. Editing evidence afterward invalidates the review; changing artifact bytes invalidates its hash.

## Evidence schema 2

`--prepare` supplies the base identity/authorization/source/time/attestation shape. Keep `mode: "physical-native"`, `emulated: false`. The verifier rejects schema-1 unchecked evidence, known WebDriver automation, synthetic native events, incomplete sessions, malformed transitions, changed bytes, absolute/escaped/symlink-escaped artifact paths and truncated traces.

Required identity strings: `session`, `operator`, `deviceModel`, `os`, `osBuild`, `browser`, `browserVersion`, `renderer`, `driverSource`, `driverVersion`, `identityArtifact`. The last field references an `os-diagnostic` artifact containing the independently reviewable native identity source.

Required source: `commit` (actual full hash), `packageVersion`, `builtEntrySha256`; all must match the downloaded collector trace. Required authorization: owned device/operator, authorized exact origin, no shared sessions, no driver modification, no audible output. Times must match collector bounds; `durationMs` equals endedAt minus startedAt and meets positive `declaredDurationMs`.

Each artifact has:

```json
{
  "id": "trace",
  "path": "xyz-physical-trace-SESSION.json",
  "sha256": "actual-64-hex-digest",
  "role": "machine-trace",
  "captureSource": "actual-collector/browser",
  "description": "actual-session-interaction-trace"
}
```

Exactly one `machine-trace`, at least one independent `native-capture` and an `os-diagnostic` are required. Native capture must contain actual PNG/JPEG/WebM/ISO-media bytes, not text claiming PASS. Hash/media-header validation is not authenticity/content review. Other roles: `sensor-trace`, `workload`. Keep all artifacts inside the evidence directory. Different roles must not reuse identical bytes. Private native captures remain local unless sharing them is separately authorized.

Each observation binds a real collector event to an independent capture:

```json
{
  "event": "pagehide",
  "sequence": 12,
  "captureArtifact": "native-recording",
  "captureLocator": "00:12.200, navigation away"
}
```

Do not copy `trusted:true` into a form and call it native evidence. It must reference the collector sample. Native-event samples with `trusted:false` block the session, even when an attestation/review is present. Browser polling, engine events, operator observations and frame measurements retain their distinct provenance.

Each scenario records actual expected/observed behavior, explicit outcome, duration and observed event names:

```json
{
  "id": "native-history-return",
  "expected": "same document resumes and renders",
  "observed": "actual measured behavior and capture references",
  "outcome": "PASS",
  "startedAt": "actual-ISO-time",
  "endedAt": "actual-later-ISO-time",
  "durationMs": 1234,
  "events": ["pagehide", "pageshow", "rendered-after-return"]
}
```

Every required event must be covered by an outcome and occur within its scenario time bounds. FAIL/incomplete outcomes remain BLOCKED. No blanket session checkbox substitutes for individual outcomes.

The independent review shape is printed by `--instructions`. It requires schemaVersion 2, exact `evidenceSha256`, independent `reviewer` (not the operator), `signedName`, ordered `signedAt`, exact printed `reviewStatement`, `decision: "ACCEPT"` and substantive `notes`. The operator's prepared `attestation.statement` must match exactly and be explicitly signed after session end. Preserve the review and report with artifacts; don't broaden accepted hardware/browser/source scope.

## Required scenarios and precise unavailable prerequisites

| Gate             | Required measured events/outcomes                                                                                    | Additional evidence / current BLOCKED prerequisite                                                                                                                                                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| physical-mobile  | touch, orientation, hidden → visible-after; actual tap activation/rotate/resume outcome                              | Separate actual iOS/iPadOS Safari and Android native-browser identities, trusted touch coordinates, independent physical device capture. Owned devices/operator authorization absent. Desktop WebKit/emulation are not substitutes.                                                                                                                   |
| physical-gamepad | connected → pressed → released → disconnected → disconnect-state; connected → axis-active → axis-rest → disconnected | Raw axes/buttons with matching engine state, settled native/engine disconnect, controller model/firmware/mapping (`controller` object). Actual owned controller/capture absent. No injected snapshots, rumble or driver changes.                                                                                                                      |
| os-ime           | compositionstart → compositionupdate → commit → cancel → selection → focus                                           | Actual `ime: {name, version, locale}`, native candidate-window capture, committed text/selection and true cancel outcome. Real OS IME/operator capture unavailable; synthetic composition is rejected.                                                                                                                                                |
| os-background    | visible-before → hidden → visible-after → resume-frame                                                               | Declared duration must be met by the actual hidden interval, suspended ticks and zero first-return-frame delta, configured audio pause behavior. Actual owned OS background/foreground capture unavailable; CDP freeze is not this scenario.                                                                                                          |
| bfcache          | persisted pagehide → persisted pageshow → rendered-after-return                                                      | Same original document ID/session, live Game, inspected recovered PNG and native history capture. Actual physical browser round trip unavailable. `persisted:false`, reload/new document remain BLOCKED.                                                                                                                                              |
| thermal          | baseline → sustained → recovery                                                                                      | Declared sustained interval, native sensor/OS thermal-pressure source/unit/timestamps/power state and workload results. Each operator observation references `sensorArtifact` and `workloadArtifact`; actual sensor trace and production workload files required. Physical telemetry/duration/operator evidence absent. No forced heat/power/cooling. |
| driver-recovery  | native-driver-loss → graphicslost → graphicsrecovered → rendered-after-recovery                                      | Operator observation includes `diagnosticArtifact`, `diagnosticLocator`, `apiSimulation:false`; actual OS driver event diagnostics, reconstructed pixels and resource/error outcomes. No naturally occurring event or separately authorized safe disposable lab procedure available. Tool never initiates one. API context/device loss is ineligible. |
| physical-audio   | None authorized                                                                                                      | Explicit no-physical-sound authorization boundary. Silent analyser/worklet results cannot pass audible output. Always BLOCKED in this protocol.                                                                                                                                                                                                       |
| spoken-at        | Spoken role/name/value/focus/edit/activation transcript would be required                                            | Explicit no-physical-sound boundary and missing owned AT/operator authorization. Collector can record an explicitly unverified operator observation; semantic DOM/ARIA snapshots or text transcripts alone cannot certify spoken output. Always BLOCKED under current authorization; no AT/speech enabled.                                            |

Thermal observation value: actual `sensorSource`, `unit`, either numeric `temperature` or explicit `thermalPressure`, `powerState`, `sensorArtifact`, `workloadArtifact`. Preserve original native trace and the real built-root production workload result (linked by the manual server); do not invent a universal thermal threshold. Per-scenario expected/observed criteria and declared duration must be justified by the actual device/workload and reviewed.

## Native desktop Safari automation boundary

`scripts/safari-platform.mjs` is an automated desktop-browser regression runner, **not** mobile Safari or real IME/controller/OS certification. It now requires `--authorization` before ports/output/driver/browser setup. Authorization scope must be `native-safari-automation`, origin `http://127.0.0.1:5216` (or actual chosen port), with an owned **isolated** test environment and the exact authorization statement above. Do not create a false authorization record just to run it. It never enables Remote Automation or changes Safari/OS settings; existing native prerequisites must already be authorized. Shared/user Safari is prohibited. On this host, missing authorization is BLOCKED; use safe inventory and managed-browser regression separately.

# Security Policy

XYZ.js is a browser-native TypeScript game engine, not a security sandbox, an authentication service, or a hosted game backend. This policy explains how to report vulnerabilities, where the engine's trust boundaries lie, and how to deploy and test it responsibly.

The implementation and its documented limits are the source of truth. See the [technical reference](docs/TECHNICAL.md), [usage guide](docs/USAGE.md), [design](DESIGN.md), and [acceptance records](ACCEPTANCE.md). Passing CI, checksums, TypeScript checks, or browser smoke scenarios does **not** establish that the project is vulnerability-free or independently security-audited.

When reading a packaged copy without the repository's documentation or source tree, use the [repository copy of this policy](https://github.com/YueyuHoshizora/XYZ.js/blob/main/SECURITY.md) to follow its relative reference links. For version-specific behavior, select the corresponding published tag rather than assuming `main` matches an older package.

## Reporting a vulnerability

### Preferred: GitHub private vulnerability reporting

Use [Report a vulnerability](https://github.com/YueyuHoshizora/XYZ.js/security/advisories/new), or open the repository's [Security tab](https://github.com/YueyuHoshizora/XYZ.js/security) and choose **Report a vulnerability**. GitHub sign-in is required. Private vulnerability reporting was confirmed enabled on 2026-10-02; repository settings and GitHub availability can change.

Keep actionable exploit details, sensitive files, and affected deployment information in the private report rather than in a public issue, discussion, pull request, or commit. Do not include live credentials even in a private report: redact them, use synthetic replacements, and tell their owner to revoke or rotate exposed credentials.

If the private form is unavailable, open a [public issue](https://github.com/YueyuHoshizora/XYZ.js/issues/new) with only a neutral request for a private security contact, such as “Private security reporting is unavailable; please provide a private reporting route.” Do **not** include a proof of concept, exploit payload, private URL, player data, token, or secret. Wait for a private route before sharing those details. This policy does not advertise a separate email inbox or another verified private channel.

For ordinary feature requests and non-security bugs, use public issues with sanitized reproductions.

### What to include privately

A useful report includes:

- The affected XYZ.js release or commit, package checksum if applicable, and whether it is source, an extracted package, a starter, or a deployed application.
- Browser and OS versions, renderer (`webgpu`, `webgl2`, `canvas2d`, or `auto`), relevant capabilities, and Node/pnpm versions for tooling issues.
- The affected entry point and trust boundary: for example, an asset URL, a glTF resource, a portable save, a factory parser, a native shader, a worker module, or a deployment path.
- Required privileges and preconditions. Distinguish data supplied by an untrusted player from application-authored JavaScript or an already-compromised origin.
- A minimal, deterministic reproduction using local synthetic data; expected behavior, observed behavior, and the potential confidentiality, integrity, or availability impact.
- Relevant file/line locations, sanitized error messages or logs, and a proposed mitigation if known.
- Whether the issue reproduces on current `main` or the latest published release, if checking that is safe. Do not repeat a dangerous reproduction simply to complete this field.
- Any coordinated disclosure constraints or upstream report references, without assuming a CVE or severity classification.

Do not attach an entire browser profile, a production save database, a credential-bearing HAR, or proprietary assets when a small synthetic fixture is sufficient. Error causes, URLs, screenshots, and logs can contain sensitive application information; review them before sharing.

### Handling and disclosure expectations

Reports can be assessed against the reachable code path and documented contract. A report may require clarification about attacker control, browser behavior, or deployment configuration. A confirmed issue may be addressed in engine code, a vendor update, deployment guidance, or an upstream browser/dependency report, depending on its cause.

There is no stated response or remediation SLA, security backport schedule, bug bounty, guaranteed CVE assignment, or guaranteed outcome. Do not interpret this policy as such a commitment. Coordinate public disclosure through the private report where possible; do not publish live secrets or other users' data. If a public GitHub advisory is issued, it can be found under [Security advisories](https://github.com/YueyuHoshizora/XYZ.js/security/advisories).

## Versions and maintenance scope

Security work is bounded to the maintained source and release line, not every historical tag or every possible platform.

- **Current `main`:** Primary investigation and fix target; development code is not automatically a published release.
- **Latest published GitHub release:** Primary released reproduction target; check release notes and any advisories for affected and fixed versions.
- **Older releases, tags, forks, or locally modified vendor files:** No separate security maintenance or backport commitment. Reports remain useful, but an upgrade may be the available remedy.

Current package metadata is **1.12.0**. Metadata or a tag alone does not prove that its release workflow completed or that downloadable artifacts are available. Use the [GitHub Releases page](https://github.com/YueyuHoshizora/XYZ.js/releases) to identify actual published artifacts; npm is currently unpublished. A maintained version does not imply certification of every browser, OS, asset, or device.

Do not rewrite historical tags or silently replace old artifacts to apply a fix. Consumers should identify the new release and its checksums explicitly, and assess their own integration, assets, and third-party modules before updating.

## Threat model and responsibility boundaries

### Data that should be treated as untrusted

Potentially untrusted inputs include asset URLs and response bodies; images, fonts, audio and OPM note data; glTF/GLB/KTX2 and referenced resources; Tiled JSON and templates; content descriptors; settings and portable saves; user text and input events; and messages/results crossing worker boundaries.

The engine applies validation and resource/lifecycle controls on specific paths. The application still decides which data sources are permitted, validates application-specific schemas and state, chooses resource budgets, and handles rejection and cleanup. A TypeScript type annotation is not runtime validation of downloaded JSON.

### Code that must be trusted

Scene hooks, callbacks, systems, factory `parse`/`create` functions, save migrations and restore adapters, custom loaders and decoders, worker modules, custom renderer implementations, and application JavaScript are executable application code. **XYZ.js does not sandbox custom JavaScript.** It executes with the permissions of its page or worker environment.

Do not turn user-supplied strings or assets into JavaScript, imports, executable callbacks, or HTML. Do not use `eval`, `new Function`, arbitrary module URLs, or unsafe HTML insertion to implement a mod or asset loader. Factory registries use explicit named definitions and parsers rather than reflected constructors; the parser and factory remain trusted code responsible for their inputs and side effects. See [factory contracts](packages/core/src/factories.ts).

A Worker separates execution from the main thread, but is not a security boundary for arbitrary attacker code. The [native worker pool](packages/assets/src/worker-jobs.ts) requires an application-trusted module URL, bounds admission, validates results through supplied definitions, and terminates running workers on cancellation. Those controls do not make an untrusted module safe or remove its available network/storage access.

### Browser and host boundaries

XYZ.js relies on browser origin isolation, CORS, secure contexts, native image/audio/font decoding, WebGPU/WebGL validation, AudioWorklet, and browser/driver resource management. It does not replace those protections or protect an origin whose HTML, scripts, service worker, build pipeline, or asset server is already compromised.

Use a separate origin for untrusted content where appropriate, and do not serve executable game content on an origin containing sensitive authenticated applications. A URL path or storage namespace is not an isolation boundary between mutually untrusted applications on the same origin.

Authentication, authorization, multiplayer/server validation, payment handling, personal-data retention, and application-specific permissions belong to the integrating application. Local saves must not be treated as authoritative server state or as proof of player entitlement.

## Asset loading and resource exhaustion

### Existing controls

The [bounded response reader](packages/assets/src/read-response.ts) counts actual bytes delivered by the browser after HTTP decompression rather than trusting `Content-Length`. Overflow rejects and cancels the reader; abort signals can cancel pending reads. JSON parsing occurs after bounded reads on the relevant loading paths.

The current [asset safety contracts](docs/TECHNICAL.md#18-asset-safety-budgets) include:

- Image response limit: **8 MiB**; OPM/audio JSON response limit: **1 MiB** and **16,384 notes**.
- Texture checks: **8,192 pixels per side** and **4,194,304 total pixels**, performed after image decode on the documented image paths.
- Generic text/JSON defaults: **1 MiB**; binary default: **8 MiB**. Generic `loadJSON` parses JSON but does not validate an application schema.
- glTF limits for input bytes, aggregate fetched/tracked decoded allocations, list sizes, accessors, geometry, skins, morph targets, and hierarchy depth. See [the loader profile](docs/TECHNICAL.md#21-advanced-3d-p09p12).

These are specific rejection limits, not a universal safe-file guarantee. Not every API uses the same reader or budget, and already-allocated caller data has different ownership from a fetched asset.

### Residual risks and application guidance

- Browser-supported image formats are retained; there is no complete pre-decode dimension parser or image-format allowlist. Decoder allocations can occur before texture limits are checked, and response chunks are allocated before their size is inspected.
- Individual byte, pixel, queue, scene, and decoded/native-residency budgets do not bound total browser memory, GPU driver memory, concurrent work, or every temporary allocation. Some budgets are configurable or unbounded unless the application sets them.
- Cooperative navigation/warmup/time budgets and `AbortSignal` do not preempt arbitrary JavaScript, a single long-running decoder, or a custom Promise. A valid-size asset can still be computationally expensive.
- Route externally supplied media through a controlled asset pipeline. Restrict source URLs and redirects, avoid sensitive query parameters and URL credentials, set concurrency/admission limits, and release assets when their consumers retire.
- The glTF loader permits referenced resources from the model's base origin and explicit `allowedOrigins`, with embedded `data:`/`blob:` resources handled separately. This is not a universal network allowlist for all loaders, a redirect firewall, or permission to trust every resource on an allowed host. Review [the actual resource checks](packages/core/src/gltf-loader.ts) and enforce origin policy at the host/CSP boundary too.
- Semantic asset bundles can verify resource sizes and SHA-256 hashes. An independently trusted `manifestSHA256` pin protects the descriptor; hashes supplied only by an attacker-controlled manifest do not authenticate it. See [asset integrity contracts](docs/TECHNICAL.md#assets-and-typed-draco) and the [asset recipe](docs/ASSET-RECIPE.md).

Handle loader failures without silently accepting malformed assets or disabling limits. Dispose loader-owned models/textures after all consumers stop; scene destruction is not automatically disposal of every externally owned asset. Use resource scopes and cooperative cancellation as documented, not indiscriminate destruction of shared loaders.

## Graphics, native hooks, and device loss

Native material/shader hooks are trusted GPU programs, not ordinary untrusted asset data. WGSL and GLSL preparation, source/uniform/texture limits, fixed engine ABI rules, actual device-limit checks, and rejection of active private GL resources constrain supported integration. They do **not** constitute a shader security audit or guarantee bounded execution time for arbitrary shader logic. See [native extension contracts](docs/TECHNICAL.md#native-extension-visibility-and-deployment-boundaries) and [native resource checks](packages/graphics/src/native-material-limits.ts).

Do not compile shader source supplied by an untrusted player without a separately designed isolation and review strategy. Keep deformation bounds accurate and only opt into tracked shadow caching when the documented deterministic-input promise is true. Retain borrowed textures until all consumers retire, and await native preparation before publishing dependent content.

Backend capability checks are not security certifications. Canvas2D remains 2D-only; unsupported native requests reject rather than secretly providing equivalent GPU behavior. Initialization fallback and same-backend device-loss recovery are availability mechanisms, not isolation or proof that a driver is safe. Recreate invalidated renderer-owned captures/targets and handle fatal recovery failures instead of suppressing errors or retrying without bound.

## Audio and OPM.js supply chain

Audio uses the official **OPM.js v1.1.0** distribution, including its DSP/worklet, rather than a private modified synthesizer. The [vendor manifest](vendor/opm/manifest.json) identifies the upstream release, archive, SHA-256 checksum, and complete unmodified distribution; retain its [license](vendor/opm/LICENSE).

- Preserve the complete official vendor tree and module/chunk/worklet paths when packaging and deploying. Do not edit, re-minify, replace individual vendor files, or keep private patches while claiming official checksum integrity.
- Verify provenance and checksums during vendor updates. A dependency audit of the lockfile may not cover vendored JavaScript; review upstream advisories and the actual vendor files separately.
- SHA-256 detects a mismatch with a trusted expected artifact. It is not a signature, proof of authorship by itself, or proof that upstream code has no vulnerabilities.
- AudioContext creation/unlock follows a user gesture. WebGPU and AudioWorklet require a secure context; do not bypass autoplay or browser security restrictions to make a demonstration pass.
- The current OPM orchestration uses eight contexts/worklets and bounded scheduling/voice admission. Browser-native sample decoding and custom codec adapters have their own allocation/execution risks; external codecs and decoder callbacks remain application-trusted dependencies.
- A game pause is not an automatic audio pause. Explicitly manage playback/context lifecycle and volume; do not infer speaker safety or physical audible-output validation from silent automated signal tests.

A report affecting XYZ.js's vendor integration belongs here. For an issue in upstream OPM.js itself, identify the upstream version and affected path and coordinate with the [upstream repository](https://github.com/YueyuHoshizora/OPM.js); do not scatter sensitive exploit details across public issues.

## Settings, saves, and portable files

Treat imported files and origin storage as mutable, untrusted data. [SaveManager](packages/core/src/storage.ts) validates envelopes and JSON values, supports schema migration, and uses revisions/compare-and-swap to avoid stale writes. Its checksum is a **non-cryptographic corruption check**, not authentication, encryption, tamper resistance, or an anti-cheat mechanism.

[PortableSaveFiles](packages/core/src/portable-save.ts) checks its **2 MiB** Blob bound before allocating text, decodes/migrates the envelope, preflights through a caller-owned fresh disposable candidate, and only then reaches revision-guarded persistence. The application must validate its own data, honor cancellation, and dispose candidate resources. Successful import persists a record; live Scene publication is a separate guarded transaction. Legacy in-place restore is not automatically atomic.

- Do not store passwords, tokens, private keys, or sensitive personal data in game saves, exported settings, caches, or downloadable JSON. Same-origin scripts and the browser-profile owner can access or alter these stores.
- Namespace saves per application, but do not treat namespaces as access control. Cross-tab coordination uses native Web Locks for localStorage writes or IndexedDB transactions. Custom storage without atomic mutation remains process-local; localStorage multi-key writes are not crash-atomic.
- Handle corrupt, unsupported, stale, quota, and cancellation failures explicitly. Keep recoverable original bytes without uploading them automatically. Do not erase revision/archive keys or overwrite a slot merely to hide an import failure.
- Only download prepared files from a trusted user action, and revoke object URLs after use. Review exported files before sharing them in reports.

See [portable-file contracts](docs/TECHNICAL.md#settings-and-portable-files) and the [upgrade checklist](docs/TECHNICAL.md#60-compatibility-policy-and-upgrade-checklist-p73).

## Safe deployment and CSP

### Serve public production artifacts only

Deploy the entire generated production tree over HTTPS, including required engine modules, vendor files, workers/worklets, and deployment headers. Do not serve the repository root, source/credential directories, `.env` files, signing material, or private build inputs. Filename checks are defense-in-depth, not a substitute for inspecting the deployment inventory. Source maps are readable output, not secret storage; minification is not encryption.

The packaged [deployment server](scripts/deployment-server.mjs) serves a public artifact directory on loopback and applies the shared headers. It is useful for local production verification, not a production TLS/authentication service:

```sh
node scripts/deployment-server.mjs <production-directory> /games/demo/ 4173
```

Configure the real production host/CDN separately, including HTTPS, correct module/worker/worklet MIME types, and an appropriate base path. Do not use `file://`, strip vendor subtrees, or disable CORS/TLS/browser sandboxing to fix deployment errors.

### Apply headers, not just files

Starter builds emit `_headers` and `deployment-headers.json`. The host must actually apply their contents; merely serving a JSON policy file does not enforce CSP. The exact current policy is defined in [deployment generation](scripts/offline-deployment.mjs).

The default policy starts with `default-src 'none'`, limits scripts/styles/connect/worker sources to the documented same-origin profile, disallows object embedding and base changes, and contains no `unsafe-inline` or `unsafe-eval`. The server also sets `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`. CSP reduces exposure; it does not make malicious same-origin scripts trustworthy or validate game assets.

Inspect actual HTTP response headers and browser console violations after deployment. Keep executable code and styles external. If the application needs extra asset/codec/media origins or a different worker mechanism, review those requirements explicitly and allow only the necessary sources; do not replace the policy with wildcards or globally enable inline/eval execution. Verify WebGPU/AudioWorklet/worker paths under the resulting enforced policy.

### Opt-in offline deployment

Generated starters enable offline deployment with `GAME_OFFLINE=1`; use `GAME_BASE` for the documented base-relative path. Offline mode is intended for **public, immutable build resources**, not authenticated responses, personal data, arbitrary runtime URLs, or offline streaming media.

The [offline worker](scripts/offline/service-worker.js) embeds a versioned manifest. Installation fetches listed resources without credentials, rejects redirects, opaque/non-success responses and `private`/`no-store` cache policy, checks relevant MIME types, and verifies sizes and SHA-256 before completing a cache generation. It does not perform arbitrary runtime-content caching.

A failed update preserves the prior complete generation. Activation waits for old tabs rather than forcing mixed versions, and a prior complete generation is retained for rollback. These mechanisms protect build consistency, not the authenticity of a compromised host or worker: an attacker controlling the build and its manifest can change both.

- Inspect every offline-manifest resource before deploying; never include secrets or user-specific responses in public build output. Keep the worker's scope as narrow as the application needs.
- Verify fresh online navigation, a fresh offline load, failed installation, update waiting/activation, rollback, and removal using the real hosted production headers.
- Use the provided owned uninstall controls to remove this application's registrations/caches without deleting player saves or unrelated origin data. Rebuilding without offline artifacts alone does not unregister an already-installed worker in existing browser profiles.
- Existing tabs and offline caches can keep an older build usable. For a security update, assess stale clients explicitly and communicate update/removal instructions; do not assume publication instantly replaces all offline copies.
- Other applications on the same origin are not isolated by cache names or URL prefixes. Separate origins remain the relevant trust boundary.

See [deployment contracts](docs/TECHNICAL.md#native-extension-visibility-and-deployment-boundaries) and [starter usage](docs/USAGE.md#40-compatible-expansion-profiles-p88p96).

## Development and dependency hygiene

Use the documented Node/pnpm versions, committed lockfile, frozen installation for reproducible verification, and existing install/release-age restrictions. Avoid speculative dependency upgrades or automatic audit fixes that change behavior without assessing reachability and compatibility. Review runtime, development/build, codec, and vendored dependencies separately; tooling executes with the developer or CI account's permissions.

Never put credentials into examples, assets, manifests, logs, source maps, or release archives. If a secret is discovered, notify its owner for revocation/rotation; deleting it from one file does not revoke it or remove historical copies. Do not use the credential to “verify” it works.

[Contributor security guidance](CLAUDE.md) describes manual review and reporting expectations. It is not an automatic scanner configuration or sandbox. Record the date, tool/version, coverage, and actual result of any security check; an unavailable scan is not a clean scan. Do not upload private source, lockfiles, or assets to an external scanning service without authorization.

## Safe testing and verification limits

Test only repositories, local fixtures, browser profiles, and deployments that you own or are explicitly authorized to assess. This policy does not authorize attacks against hosted examples, GitHub infrastructure, upstream projects, other players, or third-party services, and is not a legal safe-harbor promise.

Use a disposable local deployment and synthetic data. Start with the smallest bounded reproduction. Avoid resource-exhaustion payloads on shared infrastructure, prolonged GPU/CPU stress, driver-reset attempts, broad vulnerability scans, or probes of credential/private endpoints. Stop if testing affects other users, requires broader permission, or risks data loss. Preserve sanitized evidence rather than repeating an unsafe test.

For browser/audio checks, use an owned isolated profile with browser muting and zero-gain native audio where the scenario permits. Do not operate another person's shared browser, enable audible playback, change OS/browser security permissions, or exercise physical hardware without specific authorization. Destroy owned Games, audio contexts, workers, registrations, and temporary resources after the scenario; do not clear unrelated origin/profile data.

The [acceptance records](ACCEPTANCE.md) describe exercised native paths and historical failures as well as passes. Managed Chromium, Firefox, and WebKit results apply only to their named scenarios. Managed WebKit is **not Safari certification**. Mobile emulation is not physical-mobile evidence. No physical mobile, gamepad, OS IME, spoken assistive-technology, speaker/audio-hardware, thermal/low-tier, or real driver-reset security/safety certification follows from these tests. Short memory observations are not a long-term leak proof, and resource or quality profiles are not universal safety or frame-rate guarantees.

A security report can be valid on an untested platform; clearly identify that platform and avoid inferring broader support or physical safety from a fix on one browser.

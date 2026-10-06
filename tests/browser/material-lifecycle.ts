import { createRenderer, getPostEffects, Scene } from '../../src/index.js';
import type { Renderer, RendererPreference } from '../../src/index.js';
import { errorDetail, frameProofs, type FrameProof } from './frame-proof.js';
import {
  createMaterialLifecycleResources,
  type LifecycleResources,
} from './material-lifecycle-resources.js';

interface Counters {
  textureBytes: number;
  textureEntries: number;
  geometryBytes: number;
  geometryEntries: number;
  renderTargetBytes: number;
  trackedNativeBytes: number;
}
interface CycleEvidence {
  cycle: number;
  resourceKinds: readonly string[];
  prepared: Counters;
  peak: Counters;
  after: Counters;
  baselineRestored: boolean;
  pixelChanges: number;
  visiblePixels: number;
  drawCalls: number;
  lutResidentBytesDelta: number;
  recovery?: {
    meanRGBError: number;
    maximumChannelError: number;
    badPixels: number;
    leaseSurvived: boolean;
  };
}
export interface MaterialLifecycleReport {
  pass: boolean;
  backend: string;
  cycles: CycleEvidence[];
  counters: { baseline?: Counters; peaks?: Counters; after?: Counters };
  losses: number;
  recoveries: number;
  pixelChanges: number[];
  evidence: {
    counterScope: string;
    recoveryScope: string;
    physicalQualification: string;
    rendererLifetime: string;
    emptySweepFrames: number;
    graphicsEvents: readonly string[];
    expectedLossWarnings: string[];
  };
  errors: string[];
  scenarios: {
    name: string;
    assertions: string[];
    metrics: Record<string, number | string>;
    png?: string;
  }[];
  error?: string;
}
const requiredKinds = [
  'MaterialAsset',
  'finishes',
  'planar reflection',
  'baked volume',
  'terrain',
  'water',
  'animated image',
  'post effects',
];
const sweepFrames = 4;
const pause = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));
function measure(renderer: Renderer): Counters {
  const textureBytes = renderer.residency.textures.liveBytes;
  const geometryBytes = renderer.residency.geometry.liveBytes;
  const renderTargetBytes = renderer.stats.renderTargetBytes;
  return {
    textureBytes,
    textureEntries: renderer.residency.textures.entries,
    geometryBytes,
    geometryEntries: renderer.residency.geometry.entries,
    renderTargetBytes,
    trackedNativeBytes: textureBytes + geometryBytes + renderTargetBytes,
  };
}
function merge(a: Counters, b: Counters): Counters {
  return Object.fromEntries(
    Object.keys(a).map((key) => [
      key,
      Math.max(a[key as keyof Counters], b[key as keyof Counters]),
    ]),
  ) as unknown as Counters;
}
function exact(a: Counters, b: Counters): boolean {
  return Object.keys(a).every(
    (key) => a[key as keyof Counters] === b[key as keyof Counters],
  );
}
function difference(
  a: FrameProof,
  b: FrameProof,
): { changed: number; mean: number; bad: number; maximum: number } {
  if (a.width !== b.width || a.height !== b.height)
    throw new Error('Readback dimensions changed.');
  let changed = 0;
  let total = 0;
  let bad = 0;
  let maximumDelta = 0;
  for (let i = 0; i < a.bytes.length; i += 4) {
    let maximum = 0;
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(a.bytes[i + c] - b.bytes[i + c]);
      maximum = Math.max(maximum, delta);
      total += delta;
    }
    maximumDelta = Math.max(maximumDelta, maximum);
    if (maximum > 2) changed++;
    if (maximum > 8) bad++;
  }
  return {
    changed,
    mean: total / (a.width * a.height * 3),
    bad,
    maximum: maximumDelta,
  };
}

/** One renderer survives all resource cycles; its destruction is not the leak oracle. */
export async function runMaterialLifecycle(
  canvas: HTMLCanvasElement,
  preference: RendererPreference,
): Promise<MaterialLifecycleReport> {
  const report: MaterialLifecycleReport = {
    pass: false,
    backend: preference,
    cycles: [],
    counters: {},
    losses: 0,
    recoveries: 0,
    pixelChanges: [],
    errors: [],
    scenarios: [],
    evidence: {
      counterScope:
        'Public residency liveBytes/entries plus RenderStats.renderTargetBytes: tracked native texture/geometry cache and attachment byte estimates, not total VRAM, pipelines, driver memory or RSS. Historical peaks are not live counters.',
      recoveryScope:
        preference === 'webgpu'
          ? 'WebGPU public destructive loss injection unavailable; repeated real create/render/destroy resources only, no simulated recovery.'
          : 'Actual WEBGL_lose_context with all combined resources live and retainFrameResources held through onRecovered.',
      physicalQualification:
        'BLOCKED: no calibrated physical material qualification in this fixture.',
      rendererLifetime:
        'Single public createRenderer across all eight cycles; final destroy excluded from baseline oracle.',
      emptySweepFrames: sweepFrames,
      graphicsEvents: [],
      expectedLossWarnings: [],
    },
  };
  const output = document.querySelector<HTMLPreElement>('#report');
  const publish = (state: string): void => {
    if (output) {
      output.textContent = JSON.stringify(report);
      output.dataset.state = state;
    }
  };
  let renderer: Renderer | undefined;
  let workload: LifecycleResources | undefined;
  let intentionalLoss = false;
  const fail = (message: string): void => {
    report.errors.push(message);
  };
  const check = (condition: boolean, message: string): void => {
    if (!condition) fail(message);
  };
  const onError = (event: ErrorEvent): void =>
    fail(errorDetail(event.error ?? event.message));
  const onRejection = (event: PromiseRejectionEvent): void =>
    fail(errorDetail(event.reason));
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args: unknown[]): void => {
    fail(`Console error: ${args.map(errorDetail).join(' ')}`);
    originalError.apply(console, args);
  };
  console.warn = (...args: unknown[]): void => {
    const message = args.map(errorDetail).join(' ');
    // Browser's standard forced-loss warning is the only allowed warning.
    if (
      intentionalLoss &&
      /^WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost$/.test(message)
    )
      report.evidence.expectedLossWarnings.push(message);
    else fail(`Console warning: ${message}`);
    originalWarn.apply(console, args);
  };
  addEventListener('error', onError);
  addEventListener('unhandledrejection', onRejection);
  const waitUntil = async (
    predicate: () => boolean,
    label: string,
  ): Promise<void> => {
    const deadline = performance.now() + 20000;
    while (!predicate()) {
      if (performance.now() > deadline) throw new Error(`${label} timed out.`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };
  const empty = new Scene();
  publish('running');
  try {
    if (preference !== 'webgl2' && preference !== 'webgpu')
      throw new Error('Material lifecycle requires a forced native backend.');
    renderer = await createRenderer(
      canvas,
      preference,
      (error) => fail(`Render failure: ${errorDetail(error)}`),
      {
        antialias: false,
        recover: true,
        onLost: (error) => {
          report.losses++;
          if (!intentionalLoss)
            fail(`Unexpected graphics loss: ${errorDetail(error)}`);
        },
        onRecovered: () => {
          report.recoveries++;
        },
      },
    );
    report.backend = renderer.backend;
    if (renderer.backend !== preference)
      throw new Error(`Requested ${preference}, got ${renderer.backend}.`);
    renderer.resize(384, 256);
    const proofs = frameProofs(renderer, canvas);
    report.evidence.graphicsEvents = proofs.graphicsEvents;
    const draw = async (scene: Scene): Promise<FrameProof> => {
      await pause();
      renderer!.beginFrame();
      renderer!.render(scene, canvas.width, canvas.height);
      const pending = proofs.next();
      try {
        renderer!.endFrame();
      } catch {
        /* frameProofs rejects the submission. */
      }
      return pending;
    };
    const sweep = async (): Promise<FrameProof> => {
      let frame = await draw(empty);
      for (let i = 1; i < sweepFrames; i++) frame = await draw(empty);
      return frame;
    };
    const emptyFrame = await sweep();
    const baseline = measure(renderer);
    report.counters.baseline = baseline;
    report.counters.peaks = baseline;
    check(
      exact(baseline, measure(renderer)),
      'Warmed empty counters must be stable.',
    );
    const stableEmpty = await sweep();
    check(
      exact(baseline, measure(renderer)),
      'Warmed empty counters changed after another empty sweep.',
    );
    check(
      difference(emptyFrame, stableEmpty).changed === 0,
      'Warmed empty frame must be deterministic.',
    );
    for (let cycle = 0; cycle < 8; cycle++) {
      workload = await createMaterialLifecycleResources(
        renderer,
        canvas,
        cycle,
      );
      check(
        requiredKinds.every((kind) => workload!.resourceKinds.includes(kind)),
        `Cycle ${cycle}: all required real resource kinds must be present.`,
      );
      await workload.prepare();
      const prepared = measure(renderer);
      const first = await draw(workload.scene);
      let peak = merge(prepared, measure(renderer));
      const effects = getPostEffects(workload.scene.postProcessing)!;
      const grading = effects.colorGrading!;
      const gradedBytes = measure(renderer).textureBytes;
      let lutResidentBytesDelta = 0;
      try {
        effects.colorGrading = undefined;
        await draw(workload.scene);
        lutResidentBytesDelta = gradedBytes - measure(renderer).textureBytes;
        check(
          lutResidentBytesDelta === grading.lut.size ** 3 * 4 - 4,
          `Cycle ${cycle}: actual LUT allocation bytes are not tracked: ${lutResidentBytesDelta}.`,
        );
      } finally {
        effects.colorGrading = grading;
      }
      await draw(workload.scene);
      check(
        measure(renderer).textureBytes === gradedBytes,
        `Cycle ${cycle}: restored LUT native byte accounting differs.`,
      );
      workload.advance();
      const advanced = await draw(workload.scene);
      peak = merge(peak, measure(renderer));
      const animated = difference(first, advanced).changed;
      const visible = difference(emptyFrame, advanced).changed;
      check(
        peak.textureBytes > baseline.textureBytes &&
          peak.textureEntries > baseline.textureEntries,
        `Cycle ${cycle}: live native texture allocations must exceed empty baseline.`,
      );
      check(
        peak.geometryBytes > baseline.geometryBytes &&
          peak.geometryEntries > baseline.geometryEntries,
        `Cycle ${cycle}: live native geometry allocations must exceed empty baseline.`,
      );
      check(
        peak.renderTargetBytes > baseline.renderTargetBytes,
        `Cycle ${cycle}: actual consumed render-target allocations must exceed empty baseline.`,
      );
      check(
        advanced.stats.drawCalls > 0 && visible > 0,
        `Cycle ${cycle}: actual combined workload must visibly render.`,
      );
      check(
        animated > 0,
        `Cycle ${cycle}: real animated image/water advance must change native pixels.`,
      );
      const evidence: CycleEvidence = {
        cycle,
        resourceKinds: [...workload.resourceKinds],
        prepared,
        peak,
        after: baseline,
        baselineRestored: false,
        pixelChanges: animated,
        visiblePixels: visible,
        drawCalls: advanced.stats.drawCalls,
        lutResidentBytesDelta,
      };
      report.cycles.push(evidence);
      report.pixelChanges.push(animated);
      if (cycle === 3 && renderer.backend === 'webgl2') {
        const extension = canvas
          .getContext('webgl2')!
          .getExtension('WEBGL_lose_context');
        if (!extension)
          throw new Error('Required actual WEBGL_lose_context unavailable.');
        // Capture the exact steady frame whose resources the lease retains.
        const steady = await draw(workload.scene);
        const lease = renderer.retainFrameResources();
        const lossesBefore = report.losses;
        const recoveriesBefore = report.recoveries;
        intentionalLoss = true;
        try {
          extension.loseContext();
          await waitUntil(
            () => report.losses === lossesBefore + 1,
            'Actual GL loss notification',
          );
          extension.restoreContext();
          await waitUntil(
            () => report.recoveries === recoveriesBefore + 1,
            'Actual GL recovery notification',
          );
          check(
            report.losses === lossesBefore + 1 &&
              report.recoveries === recoveriesBefore + 1,
            'Exactly one actual loss and recovery notification required.',
          );
          const leaseSurvived = !lease.released;
          check(
            leaseSurvived,
            'Frame resource lease must survive actual native recovery.',
          );
          // Planar capture is renderer-owned and must be recaptured after restore.
          await workload.prepare();
          const recovered = await draw(workload.scene);
          const delta = difference(steady, recovered);
          evidence.recovery = {
            meanRGBError: delta.mean,
            maximumChannelError: delta.maximum,
            badPixels: delta.bad,
            leaseSurvived,
          };
          check(
            delta.mean <= 0.001 && delta.maximum <= 1,
            `Recovered same steady combined scene differs: mean=${delta.mean}, maxChannel=${delta.maximum}.`,
          );
          evidence.peak = merge(evidence.peak, measure(renderer));
        } finally {
          lease.release();
          intentionalLoss = false;
        }
      }
      workload.destroy();
      workload = undefined;
      await sweep();
      evidence.after = measure(renderer);
      evidence.baselineRestored = exact(baseline, evidence.after);
      check(
        evidence.baselineRestored,
        `Cycle ${cycle}: exact warmed empty baseline not restored: ${JSON.stringify(evidence.after)} versus ${JSON.stringify(baseline)}.`,
      );
      report.counters.peaks = merge(report.counters.peaks!, evidence.peak);
      report.counters.after = evidence.after;
      report.scenarios.push({
        name: `material-lifecycle-cycle-${cycle}`,
        assertions: evidence.baselineRestored
          ? [
              'Exact warmed empty baseline restored without renderer destruction.',
            ]
          : [],
        metrics: {
          pixelChanges: animated,
          visiblePixels: visible,
          trackedNativeBytes: evidence.peak.trackedNativeBytes,
          lutResidentBytesDelta,
        },
        png: advanced.png,
      });
      publish('running');
    }
    await pause();
    check(report.cycles.length === 8, 'Eight combined cycles required.');
    if (renderer.backend === 'webgl2') {
      check(
        report.losses === 1 && report.recoveries === 1,
        'Real GL loss/recovery evidence missing.',
      );
      check(
        proofs.graphicsEvents.length === 2 &&
          proofs.graphicsEvents[0].startsWith('WebGL context lost:') &&
          proofs.graphicsEvents[1] === 'WebGL context restored',
        'Unexpected native graphics events.',
      );
    } else {
      check(
        report.losses === 0 &&
          report.recoveries === 0 &&
          proofs.graphicsEvents.length === 0,
        'WebGPU repeated lifecycle must have no unexpected loss or graphics errors.',
      );
    }
  } catch (error) {
    fail(errorDetail(error));
  } finally {
    // Final teardown is outside the oracle and may emit GPUDevice.destroy().
    report.evidence.graphicsEvents = [...report.evidence.graphicsEvents];
    try {
      workload?.destroy();
    } catch (error) {
      fail(`Workload cleanup: ${errorDetail(error)}`);
    }
    empty.destroy();
    // All pass/fail counters above precede this final renderer cleanup.
    try {
      renderer?.destroy();
    } catch (error) {
      fail(`Renderer cleanup: ${errorDetail(error)}`);
    }
    removeEventListener('error', onError);
    removeEventListener('unhandledrejection', onRejection);
    console.error = originalError;
    console.warn = originalWarn;
  }
  report.pass = report.errors.length === 0 && report.cycles.length === 8;
  if (!report.pass) report.error = report.errors.join('\n');
  publish(report.pass ? 'passed' : 'failed');
  return report;
}

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (canvas) {
  const preference = (new URLSearchParams(location.search).get('renderer') ??
    'webgl2') as RendererPreference;
  void runMaterialLifecycle(canvas, preference);
}

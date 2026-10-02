import {
  type Game,
  gamepadButtonIndex,
  gamepadAxisIndex,
} from '../../src/index.js';

type SourceIdentity = {
  commit: string;
  packageVersion: string;
  builtEntrySha256: string;
};
type Sample = {
  sequence: number;
  at: string;
  event: string;
  source: string;
  trusted: boolean | null;
  value: Record<string, unknown>;
};

// The collector never asserts ownership, authenticity or physical PASS. Browser automation
// can produce isTrusted events too; independent human/native capture review is mandatory.
export function installPhysicalCollector(
  game: Game,
  ticks: () => number,
  capture: () => Promise<{ bytes: Uint8ClampedArray; png: string }>,
): void {
  const panel = document.createElement('section');
  panel.innerHTML = `<h2>Owned-device evidence collector (never automatic physical PASS)</h2>
    <p>No pairing, driver reset, audio or OS control. Record independent native capture. Input/IME text is recorded; use test text, never secrets.</p>
    <label>Prepared evidence session UUID <input id="physical-session" autocomplete="off"></label>
    <button id="physical-start">Start measured session</button>
    <button id="physical-end" disabled>End session and download trace</button>
    <button id="physical-frame" disabled>Measure actual rendered frame</button>
    <a href="./physical-away.html">Leave for BFCache (then browser Back)</a>
    <p>Thermal/driver/AT observations are explicit operator statements, not browser measurements.</p>
    <label>Observation event <select id="physical-event"><option>baseline</option><option>sustained</option><option>recovery</option><option>native-driver-loss</option><option>spoken-announcement</option></select></label>
    <label>Actual measured native diagnostic JSON <textarea id="physical-value" placeholder='{"sensorSource":"native tool/version", "unit":"°C", "temperature":0, "powerState":"actual", "sensorArtifact":"sensor-trace-id", "workloadArtifact":"workload-id"}'></textarea></label>
    <button id="physical-note" disabled>Record operator observation</button>
    <output id="physical-status" aria-live="polite"></output>`;
  document.querySelector('#report')!.before(panel);
  const status = panel.querySelector<HTMLOutputElement>('#physical-status')!;
  const documentId = crypto.randomUUID();
  let active = false;
  let pending = 0;
  let endedAt = '';
  let startedAt = '';
  let session = '';
  let source: SourceIdentity | undefined;
  let truncated = false;
  const samples: Sample[] = [];
  const note = (message: string): void => {
    status.value = message;
  };
  const base = (): Record<string, unknown> => ({
    documentId,
    ticks: ticks(),
    delta: game.clock.deltaTime,
    gameState: game.state,
    audioPaused: game.audio.paused,
    visibility: document.visibilityState,
  });
  const record = (
    event: string,
    origin: string,
    trusted: boolean | null,
    value: Record<string, unknown>,
  ): void => {
    if (!active) return;
    if (samples.length >= 20000) {
      truncated = true;
      note('Trace capacity exceeded; session cannot qualify.');
      return;
    }
    samples.push({
      sequence: samples.length,
      at: new Date().toISOString(),
      event,
      source: origin,
      trusted,
      value: { ...base(), ...value },
    });
  };
  const native = (
    event: Event,
    name: string,
    value: Record<string, unknown> = {},
  ): void => record(name, 'native-event', event.isTrusted, value);
  const field = document.querySelector<HTMLInputElement>(
    'input[aria-label="Native field"]',
  )!;
  const editing = (): Record<string, unknown> => ({
    value: field.value,
    selection: [field.selectionStart, field.selectionEnd],
    selectionDirection: field.selectionDirection,
    focused: document.activeElement === field,
  });
  let compositionInitial = '';
  field.addEventListener('compositionstart', (event) => {
    compositionInitial = field.value;
    native(event, 'compositionstart', { ...editing(), data: event.data });
  });
  field.addEventListener('compositionupdate', (event) =>
    native(event, 'compositionupdate', { ...editing(), data: event.data }),
  );
  field.addEventListener('compositionend', (event) =>
    native(
      event,
      event.data === '' && field.value === compositionInitial
        ? 'cancel'
        : 'commit',
      { ...editing(), data: event.data },
    ),
  );
  field.addEventListener('input', (event) =>
    native(event, 'input', {
      ...editing(),
      inputType: (event as InputEvent).inputType,
      composing: (event as InputEvent).isComposing,
    }),
  );
  document.addEventListener('selectionchange', (event) => {
    if (document.activeElement === field) native(event, 'selection', editing());
  });
  document.addEventListener('focusin', (event) =>
    native(event, 'focus', {
      ...editing(),
      target:
        (event.target as HTMLElement)?.getAttribute('aria-label') ??
        (event.target as HTMLElement)?.id,
    }),
  );
  document.querySelector('#game')!.addEventListener('pointerdown', (event) => {
    const pointer = event as PointerEvent;
    native(event, pointer.pointerType === 'touch' ? 'touch' : 'pointer', {
      pointerType: pointer.pointerType,
      x: pointer.clientX,
      y: pointer.clientY,
    });
  });
  const orientation = (event: Event): void =>
    native(event, 'orientation', {
      angle:
        screen.orientation?.angle ??
        (window as Window & { orientation?: number }).orientation,
      width: innerWidth,
      height: innerHeight,
    });
  if (screen.orientation)
    screen.orientation.addEventListener('change', orientation);
  else addEventListener('orientationchange', orientation);
  document.addEventListener('visibilitychange', (event) => {
    native(event, document.hidden ? 'hidden' : 'visible-after');
    if (!document.hidden)
      requestAnimationFrame(() =>
        record('resume-frame', 'measurement', null, base()),
      );
  });
  for (const name of ['freeze', 'resume'])
    document.addEventListener(name, (event) => native(event, name));
  addEventListener('pagehide', (event) =>
    native(event, 'pagehide', { persisted: event.persisted }),
  );
  addEventListener('pageshow', (event) =>
    native(event, 'pageshow', { persisted: event.persisted }),
  );
  const padValue = (pad: Gamepad): Record<string, unknown> => ({
    index: pad.index,
    id: pad.id,
    mapping: pad.mapping,
    connected: pad.connected,
    timestamp: pad.timestamp,
    buttons: pad.buttons.map((button) => ({
      pressed: button.pressed,
      touched: button.touched,
      value: button.value,
    })),
    axes: Array.from(pad.axes),
    engine: {
      index: game.input.gamepad.index,
      id: game.input.gamepad.id,
      connected: game.input.gamepad.connected,
      buttons: Object.fromEntries(
        (
          Object.keys(gamepadButtonIndex) as (keyof typeof gamepadButtonIndex)[]
        ).map((name) => [name, game.input.gamepad.button(name)]),
      ),
      axes: Object.fromEntries(
        (
          Object.keys(gamepadAxisIndex) as (keyof typeof gamepadAxisIndex)[]
        ).map((name) => [name, game.input.gamepad.axis(name)]),
      ),
    },
  });
  addEventListener('gamepadconnected', (event) =>
    native(event, 'connected', padValue(event.gamepad)),
  );
  addEventListener('gamepaddisconnected', (event) => {
    native(event, 'disconnected', padValue(event.gamepad));
    requestAnimationFrame(() =>
      record('disconnect-state', 'browser-poll', null, {
        index: event.gamepad.index,
        nativeConnected:
          !!navigator.getGamepads?.()[event.gamepad.index]?.connected,
        engine: {
          index: game.input.gamepad.index,
          connected: game.input.gamepad.connected,
        },
      }),
    );
  });
  const previousPads = new Map<
    number,
    { pressed: boolean; moving: boolean; signature: string }
  >();
  let previousPoll = 0;
  const poll = (at: number): void => {
    if (active && at - previousPoll >= 100) {
      previousPoll = at;
      try {
        for (const pad of navigator.getGamepads?.() ?? []) {
          if (!pad) continue;
          const value = padValue(pad);
          const pressed = pad.buttons.some((button) => button.pressed);
          const moving = pad.axes.some((axis) => Math.abs(axis) > 0.2);
          const signature = JSON.stringify({
            buttons: value.buttons,
            axes: value.axes,
          });
          const previous = previousPads.get(pad.index);
          if (!previous || previous.signature !== signature)
            record('gamepad-snapshot', 'browser-poll', null, value);
          if (!previous || previous.pressed !== pressed)
            record(
              pressed ? 'pressed' : 'released',
              'browser-poll',
              null,
              value,
            );
          if (!previous || previous.moving !== moving)
            record(
              moving ? 'axis-active' : 'axis-rest',
              'browser-poll',
              null,
              value,
            );
          previousPads.set(pad.index, { pressed, moving, signature });
        }
      } catch (error) {
        record('poll-error', 'measurement', null, { error: String(error) });
      }
    }
    if (game.state !== 'destroyed') requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
  for (const name of ['graphicslost', 'graphicsrecovered', 'error'])
    game.addEventListener(name, (event) =>
      record(name, 'engine-event', null, {
        backend: game.graphics.backend,
        detail: String((event as CustomEvent).detail),
      }),
    );
  const startButton =
    panel.querySelector<HTMLButtonElement>('#physical-start')!;
  const endButton = panel.querySelector<HTMLButtonElement>('#physical-end')!;
  const frameButton =
    panel.querySelector<HTMLButtonElement>('#physical-frame')!;
  const observationButton =
    panel.querySelector<HTMLButtonElement>('#physical-note')!;
  startButton.addEventListener('click', (event) => {
    void (async () => {
      session = panel
        .querySelector<HTMLInputElement>('#physical-session')!
        .value.trim();
      if (!/^[a-f0-9-]{36}$/i.test(session))
        throw new Error('Paste the UUID from --prepare evidence.json.');
      const response = await fetch('/__xyz/qualification-source', {
        cache: 'no-store',
      });
      if (!response.ok)
        throw new Error(
          'Use the built-root platform-manual server for source identity.',
        );
      source = (await response.json()) as SourceIdentity;
      samples.length = 0;
      previousPads.clear();
      truncated = false;
      endedAt = '';
      startedAt = new Date().toISOString();
      active = true;
      native(event, 'visible-before');
      startButton.disabled = true;
      endButton.disabled =
        frameButton.disabled =
        observationButton.disabled =
          false;
      note(
        'Recording unverified interaction evidence. Native capture and honest review are still required.',
      );
    })().catch((error: unknown) => note(String(error)));
  });
  frameButton.addEventListener('click', () => {
    pending++;
    endButton.disabled = true;
    frameButton.disabled = true;
    void (async () => {
      const proof = await capture();
      const bytes = new Uint8Array(proof.bytes);
      const hashed = await crypto.subtle.digest('SHA-256', bytes);
      const pixelSha256 = Array.from(new Uint8Array(hashed), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
      const event = samples.some(
        (sample) => sample.event === 'graphicsrecovered',
      )
        ? 'rendered-after-recovery'
        : 'rendered-after-return';
      record(event, 'measurement', null, {
        pixelSha256,
        png: proof.png,
        gameState: game.state,
      });
      note(
        'Actual rendered pixels recorded; human must inspect PNG and recovered content.',
      );
    })()
      .catch((error: unknown) => {
        record('capture-error', 'measurement', null, { error: String(error) });
        note(String(error));
      })
      .finally(() => {
        pending--;
        endButton.disabled = pending !== 0;
        frameButton.disabled = !active;
      });
  });
  observationButton.addEventListener('click', () => {
    try {
      const value: unknown = JSON.parse(
        panel.querySelector<HTMLTextAreaElement>('#physical-value')!.value,
      );
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Measured diagnostic must be a JSON object.');
      record(
        panel.querySelector<HTMLSelectElement>('#physical-event')!.value,
        'operator-observation',
        null,
        value as Record<string, unknown>,
      );
      note(
        'Recorded explicitly unverified human observation; attach native diagnostic artifacts.',
      );
    } catch (error) {
      note(String(error));
    }
  });
  endButton.addEventListener('click', () => {
    if (pending || !active) return;
    record('session-end', 'measurement', null, base());
    endedAt = new Date().toISOString();
    active = false;
    const trace = {
      schemaVersion: 2,
      kind: 'xyz-physical-interaction-trace',
      collectionMode: 'operator-interaction-unverified',
      certification: false,
      session,
      documentId,
      source,
      startedAt,
      endedAt,
      truncated,
      environment: {
        origin: location.origin,
        secureContext: isSecureContext,
        webdriver: navigator.webdriver,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages,
        renderer: game.graphics.backend,
        dpr: devicePixelRatio,
        viewport: [innerWidth, innerHeight],
        screen: [screen.width, screen.height],
      },
      samples,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(trace, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `xyz-physical-trace-${session}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    endButton.disabled =
      frameButton.disabled =
      observationButton.disabled =
        true;
    note(
      'Unverified trace downloaded. Hash, bind artifacts/scenarios, attest and obtain independent review; no automatic physical certification.',
    );
  });
}

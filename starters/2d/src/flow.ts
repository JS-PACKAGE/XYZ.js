import {
  Game,
  Scene,
  SaveManager,
  IndexedDBStorage,
  AutosaveController,
  type Texture,
  type JsonValue,
  type RendererPreference,
} from 'xyz.js';
import { en, zhHant, type Locale, type Message } from './locales.js';
import './style.css';
export type Outcome = 'playing' | 'won' | 'lost';
export interface Checkpoint {
  position: number[];
  collected: boolean[];
  remaining: number;
  outcome: Outcome;
}
export interface Controls {
  held: Set<string>;
  jump: boolean;
}
export interface Arena extends Scene {
  reset(): void;
  restore(checkpoint: Checkpoint): void;
  snapshot(): Checkpoint;
  valid(checkpoint: unknown): checkpoint is Checkpoint;
  dispose?(): void;
}
export interface Events {
  collect(): void;
  finish(outcome: 'won' | 'lost'): void;
  hud(count: number, remaining: number): void;
}
interface Preferences {
  locale: Locale;
  volume: number;
  muted: boolean;
}
interface Saved {
  preferences: Preferences;
  checkpoint: Checkpoint | null;
}
type Mode =
  | 'loading'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'settingsMode'
  | 'won'
  | 'lost'
  | 'destroyed';
const element = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
export function validCheckpoint(
  value: unknown,
  dimension: '2d' | '3d',
): value is Checkpoint {
  if (!value || typeof value !== 'object') return false;
  const v = value as Checkpoint;
  return (
    Array.isArray(v.position) &&
    v.position.length === 3 &&
    v.position.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    (dimension === '2d'
      ? v.position[0]! >= 14 &&
        v.position[0]! <= 786 &&
        v.position[1]! >= 14 &&
        v.position[1]! <= 466 &&
        v.position[2] === 0
      : Math.abs(v.position[0]!) <= 7.6 &&
        v.position[1]! >= 0.5 &&
        v.position[1]! <= 5 &&
        Math.abs(v.position[2]!) <= 7.6) &&
    Array.isArray(v.collected) &&
    v.collected.length === 5 &&
    v.collected.every((item) => typeof item === 'boolean') &&
    Number.isFinite(v.remaining) &&
    v.remaining >= 0 &&
    v.remaining <= 90 &&
    ['playing', 'won', 'lost'].includes(v.outcome)
  );
}
export async function boot(
  kind: '2d' | '3d',
  create: (texture: Texture, controls: Controls, events: Events) => Arena,
): Promise<void> {
  const lifetime = new AbortController();
  const controls: Controls = { held: new Set(), jump: false };
  const preferences: Preferences = {
    locale: navigator.language.startsWith('zh') ? 'zh-Hant' : 'en',
    volume: 0.4,
    muted: false,
  };
  let game: Game | undefined, arena: Arena | undefined;
  let mode: Mode = 'loading',
    settingsReturn: Mode = 'menu';
  let pending: Checkpoint | null = null,
    readySound = false,
    cleaned = false,
    runStarted = false;
  let hudCount = 0,
    hudTime = 90;
  let autosave: AutosaveController | undefined;
  let recoveryPending = false,
    corruptBlocked = false;
  let saveStatus: Message = 'missing';
  const t = (key: Message): string =>
    (preferences.locale === 'en' ? en : zhHant)[key];
  const detail = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);
  const resetInput = (): void => {
    controls.held.clear();
    controls.jump = false;
    game?.input.reset();
  };
  const showError = (key: Message, error: unknown): void => {
    if (!cleaned) element('error').textContent = t(key) + ' ' + detail(error);
  };
  function render(): void {
    document.documentElement.lang = preferences.locale;
    document.title = t('title');
    for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]'))
      node.textContent = t(node.dataset.i18n as Message);
    element('mode').textContent = t(mode);
    element('hud').textContent =
      t('crystals') +
      ': ' +
      hudCount +
      '/5 · ' +
      t('seconds') +
      ': ' +
      Math.ceil(hudTime);
    const menu = mode === 'menu',
      paused = mode === 'paused',
      ended = mode === 'won' || mode === 'lost';
    for (const id of [
      'start',
      'continue',
      'unlock',
      'muted',
      'pause',
      'resume',
      'settings',
      'restart',
      'save',
    ])
      element<HTMLButtonElement>(id).disabled = true;
    element<HTMLButtonElement>('start').disabled = !menu || !readySound;
    element<HTMLButtonElement>('continue').disabled =
      !menu || !readySound || !pending || recoveryPending;
    element<HTMLButtonElement>('unlock').disabled =
      cleaned || !game || game.audio.unlocked;
    element<HTMLButtonElement>('muted').disabled = !menu;
    element<HTMLButtonElement>('pause').disabled = mode !== 'playing';
    element<HTMLButtonElement>('resume').disabled = !paused;
    element('resume').hidden = !paused;
    element<HTMLButtonElement>('settings').disabled = ![
      'menu',
      'playing',
      'paused',
      'won',
      'lost',
    ].includes(mode);
    element<HTMLButtonElement>('restart').disabled = !ended;
    element('restart').hidden = !ended;
    element<HTMLButtonElement>('save').disabled =
      !runStarted || cleaned || mode === 'loading';
    element<HTMLFieldSetElement>('movement').disabled = mode !== 'playing';
    element('settings-panel').hidden = mode !== 'settingsMode';
    element<HTMLSelectElement>('locale').value = preferences.locale;
    element<HTMLInputElement>('volume').value = String(preferences.volume);
    element<HTMLInputElement>('mute').checked = preferences.muted;
    element('jump').hidden = kind === '2d';
    element('save-status').textContent = t(saveStatus);
    element<HTMLButtonElement>('retry-save').disabled =
      cleaned ||
      !autosave?.state.retryRequired ||
      recoveryPending ||
      corruptBlocked ||
      saveStatus === 'stale';
    element<HTMLButtonElement>('recover-save').disabled =
      cleaned || !recoveryPending || mode !== 'menu';
    element('recover-save').hidden = !recoveryPending;
    element('reload-save').hidden = saveStatus !== 'stale';
    element('raw-panel').hidden =
      !element<HTMLTextAreaElement>('raw-save').value;
  }
  const saves = new SaveManager(
    new IndexedDBStorage('crystal-courier-' + kind),
    {
      version: 1,
      validate: (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value))
          return false;
        const data = value as unknown as Saved,
          p = data.preferences;
        return (
          !!p &&
          ['en', 'zh-Hant'].includes(p.locale) &&
          typeof p.muted === 'boolean' &&
          Number.isFinite(p.volume) &&
          p.volume >= 0 &&
          p.volume <= 1 &&
          (data.checkpoint === null ||
            (validCheckpoint(data.checkpoint, kind) &&
              (!arena || arena.valid(data.checkpoint))))
        );
      },
    },
  );
  function capture(): JsonValue {
    return JSON.parse(
      JSON.stringify({
        preferences,
        checkpoint: runStarted ? arena!.snapshot() : pending,
      }),
    ) as JsonValue;
  }
  async function save(): Promise<void> {
    if (cleaned || !arena || !autosave) return;
    if (recoveryPending || corruptBlocked) {
      saveStatus = 'corrupt';
      render();
      return;
    }
    autosave.request();
    try {
      await autosave.flush();
    } catch {
      /* onState exposes the failure; only Retry triggers another attempt. */
    }
  }
  function pause(): void {
    if (mode !== 'playing') return;
    mode = 'paused';
    resetInput();
    game?.pause();
    render();
    void save();
  }
  function play(restore: boolean): void {
    if (!arena || !game || !readySound || cleaned) return;
    resetInput();
    if (restore && pending) arena.restore(pending);
    else arena.reset();
    runStarted = true;
    const snapshot = arena.snapshot();
    mode = snapshot.outcome;
    hudCount = snapshot.collected.filter(Boolean).length;
    hudTime = snapshot.remaining;
    game.start();
    if (mode !== 'playing') game.pause();
    render();
    element<HTMLCanvasElement>('game').focus();
    void save();
  }
  function destroy(): void {
    if (cleaned) return;
    cleaned = true;
    mode = 'destroyed';
    resetInput();
    lifetime.abort();
    autosave?.destroy();
    saves.destroy();
    try {
      arena?.dispose?.();
      game?.destroy();
    } catch (error) {
      element('error').textContent = t('error') + ' ' + detail(error);
    }
    render();
    for (const control of document.querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLSelectElement
    >('button,input,select'))
      control.disabled = true;
  }
  const listen = (
    target: EventTarget,
    type: string,
    action: EventListener,
  ): void => {
    target.addEventListener(type, action, { signal: lifetime.signal });
  };
  const click = (id: string, action: () => void): void =>
    listen(element(id), 'click', action);
  click('destroy', destroy);
  click('start', () => play(false));
  click('restart', () => play(false));
  click('continue', () => play(true));
  click('save', () => {
    void save();
  });
  click('pause', pause);
  click('retry-save', () => {
    void autosave?.retry().catch(() => {});
  });
  click('reload-save', () => {
    location.reload();
  });
  click('view-damaged', () => {
    void saves
      .damagedPayload('checkpoint')
      .then((raw) => {
        if (!cleaned) {
          element<HTMLTextAreaElement>('raw-save').value = raw ?? '';
          render();
        }
      })
      .catch((error) => showError('loadError', error));
  });
  click('recover-save', () => {
    if (!recoveryPending || mode !== 'menu') return;
    element<HTMLButtonElement>('recover-save').disabled = true;
    void saves
      .restore('checkpoint', { signal: lifetime.signal })
      .then(async (record) => {
        if (cleaned) return;
        const data = record.data as unknown as Saved;
        Object.assign(preferences, data.preferences);
        pending = data.checkpoint;
        recoveryPending = false;
        corruptBlocked = false;
        saveStatus = 'restored';
        readySound = preferences.muted || !!game?.audio.unlocked;
        if (game)
          game.audio.master.volume = preferences.muted ? 0 : preferences.volume;
        element<HTMLTextAreaElement>('raw-save').value =
          (await saves.damagedPayload('checkpoint')) ?? '';
        if (!cleaned) render();
      })
      .catch((error) => {
        showError('loadError', error);
        if (!cleaned) render();
      });
  });
  click('resume', () => {
    if (mode === 'paused') {
      resetInput();
      mode = 'playing';
      game?.resume();
      render();
      element('game').focus();
    }
  });
  click('muted', () => {
    preferences.muted = true;
    readySound = true;
    if (game) game.audio.master.volume = 0;
    render();
    element('error').textContent = t('soundOff');
    void save();
  });
  click('unlock', () => {
    if (!game || cleaned) return;
    const runtime = game;
    // Called directly from a trusted button gesture, before any storage await.
    void runtime.audio
      .unlock()
      .then(() => {
        if (cleaned) return;
        preferences.muted = false;
        readySound = true;
        runtime.audio.master.volume = preferences.volume;
        render();
        element('error').textContent = t('soundOn');
        void save();
      })
      .catch((error) => showError('audioError', error));
  });
  click('settings', () => {
    settingsReturn = mode === 'playing' ? 'paused' : mode;
    if (mode === 'playing') pause();
    mode = 'settingsMode';
    resetInput();
    render();
  });
  click('close-settings', () => {
    mode = settingsReturn;
    render();
    void save();
  });
  listen(element('locale'), 'change', () => {
    preferences.locale = element<HTMLSelectElement>('locale').value as Locale;
    render();
  });
  listen(element('volume'), 'input', () => {
    preferences.volume = Number(element<HTMLInputElement>('volume').value);
    if (game)
      game.audio.master.volume = preferences.muted ? 0 : preferences.volume;
  });
  listen(element('mute'), 'change', () => {
    preferences.muted = element<HTMLInputElement>('mute').checked;
    if (game)
      game.audio.master.volume = preferences.muted ? 0 : preferences.volume;
  });
  const keys: Record<string, string> = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };
  listen(window, 'keydown', ((event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      pause();
      return;
    }
    if (
      mode !== 'playing' ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLButtonElement
    )
      return;
    const action = keys[event.code];
    if (action || event.code === 'Space') event.preventDefault();
    if (action) controls.held.add(action);
    if (event.code === 'Space' && !event.repeat) controls.jump = true;
  }) as EventListener);
  listen(window, 'keyup', ((event: KeyboardEvent) => {
    const action = keys[event.code];
    if (action) controls.held.delete(action);
  }) as EventListener);
  listen(window, 'blur', () => {
    resetInput();
    pause();
  });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) pause();
  });
  listen(window, 'pagehide', ((event: PageTransitionEvent) => {
    if (event.persisted) pause();
    else destroy();
  }) as EventListener);
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-move]',
  )) {
    const action = button.dataset.move!;
    listen(button, 'pointerdown', ((event: PointerEvent) => {
      if (mode === 'playing') {
        button.setPointerCapture(event.pointerId);
        controls.held.add(action);
      }
    }) as EventListener);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
      listen(button, type, () => {
        controls.held.delete(action);
      });
    // Keyboard users can hold Space/Enter on the same semantic controls.
    listen(button, 'keydown', ((event: KeyboardEvent) => {
      if (mode === 'playing' && ['Space', 'Enter'].includes(event.code)) {
        event.preventDefault();
        controls.held.add(action);
      }
    }) as EventListener);
    listen(button, 'keyup', () => controls.held.delete(action));
    listen(button, 'blur', () => controls.held.delete(action));
  }
  click('jump', () => {
    if (mode === 'playing') controls.jump = true;
  });
  render();
  try {
    const requested =
      new URLSearchParams(location.search).get('renderer') ??
      (kind === '2d' ? 'canvas2d' : 'webgl2');
    if (!['auto', 'canvas2d', 'webgl2', 'webgpu'].includes(requested))
      throw new Error('Unsupported renderer query.');
    game = await Game.create({
      canvas: '#game',
      width: 800,
      height: 480,
      renderer: requested as RendererPreference,
      audioPause: { onPause: true, onHidden: true },
    });
    if (cleaned) {
      game.destroy();
      return;
    }
    if (kind === '3d' && !game.graphics.capabilities.threeD)
      throw new Error('3D requires WebGL2 or WebGPU.');
    listen(game, 'error', ((event: CustomEvent<Error>) => {
      pause();
      showError('error', event.detail);
    }) as EventListener);
    const [texture, sound] = await Promise.all([
      game.assets.loadTexture(import.meta.env.BASE_URL + 'assets/pixel.png', {
        signal: lifetime.signal,
      }),
      game.audio.load(import.meta.env.BASE_URL + 'assets/collect.json', {
        signal: lifetime.signal,
      }),
    ]);
    if (cleaned) return;
    arena = create(texture, controls, {
      collect: () => {
        if (!preferences.muted && game?.audio.unlocked) {
          try {
            sound.play();
          } catch (error) {
            showError('audioError', error);
          }
        }
        void save();
      },
      finish: (outcome) => {
        mode = outcome;
        resetInput();
        game?.pause();
        render();
        void save();
      },
      hud: (count, remaining) => {
        hudCount = count;
        hudTime = remaining;
        element('hud').textContent =
          t('crystals') +
          ': ' +
          count +
          '/5 · ' +
          t('seconds') +
          ': ' +
          Math.ceil(remaining);
        if (mode === 'playing' && !recoveryPending && !corruptBlocked)
          autosave?.request();
      },
    });
    await game.setScene(arena);
    if (cleaned) return;
    try {
      const loaded = await saves.load('checkpoint', {
        recovery: true,
        signal: lifetime.signal,
      });
      if (cleaned) return;
      if (loaded.status === 'loaded') {
        const data = loaded.record.data as unknown as Saved;
        Object.assign(preferences, data.preferences);
        pending = data.checkpoint;
        recoveryPending = !!loaded.recovery;
        if (loaded.recovery)
          element<HTMLTextAreaElement>('raw-save').value = loaded.recovery.raw;
        saveStatus = recoveryPending
          ? 'recoveryAvailable'
          : pending
            ? 'restored'
            : 'missing';
      } else if (loaded.status === 'corrupt') {
        corruptBlocked = true;
        saveStatus = 'corrupt';
        element<HTMLTextAreaElement>('raw-save').value = loaded.raw;
      }
    } catch (error) {
      showError('loadError', error);
      saveStatus = 'loadError';
    }
    readySound = preferences.muted;
    game.audio.master.volume = preferences.muted ? 0 : preferences.volume;
    autosave = new AutosaveController(saves, {
      slot: 'checkpoint',
      capture,
      intervalMs: 5000,
      signal: lifetime.signal,
      onState: (state) => {
        if (cleaned) return;
        if (state.status === 'saving') saveStatus = 'saving';
        if (state.status === 'dirty') saveStatus = 'dirty';
        if (state.status === 'saved') {
          saveStatus = 'saved';
          pending = runStarted ? arena!.snapshot() : pending;
          element('error').textContent = '';
        }
        if (state.status === 'error') {
          const code =
            state.error &&
            typeof state.error === 'object' &&
            'code' in state.error
              ? state.error.code
              : null;
          saveStatus =
            code === 'stale'
              ? 'stale'
              : code === 'unsupported'
                ? 'unsupported'
                : 'saveError';
          showError(saveStatus, state.error);
        }
        render();
      },
    });
    mode = 'menu';
    game.start();
    game.pause();
    render();
  } catch (error) {
    if (!cleaned) {
      showError('error', error);
      destroy();
    }
  }
}

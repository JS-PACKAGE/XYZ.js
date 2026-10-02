import {
  IndexedDBStorage,
  SettingsManager,
  PortableSaveFiles,
  downloadSaveFile,
  readSaveFile,
} from 'xyz.js';
import type { Game, SaveManager, SaveRecord } from 'xyz.js';
import type { Checkpoint, Controls } from './flow.js';

export interface SettingsUI {
  readonly busy: boolean;
  render(mode: string): void;
  destroy(): void;
}

export async function attachSettings(
  game: Game,
  controls: Controls,
  saves: SaveManager,
  kind: '2d' | '3d',
  signal: AbortSignal,
  mode: () => string,
  imported: (checkpoint: Checkpoint) => void,
  validateCandidate: (record: SaveRecord) => void,
): Promise<SettingsUI> {
  const actions = game.input.contexts.create('courier', {
    bindings: {
      up: [{ key: 'KeyW' }, { key: 'ArrowUp' }],
      down: [{ key: 'KeyS' }, { key: 'ArrowDown' }],
      left: [{ key: 'KeyA' }, { key: 'ArrowLeft' }],
      right: [{ key: 'KeyD' }, { key: 'ArrowRight' }],
      jump: [{ key: 'Space' }],
    },
  });
  controls.actions = actions;
  const settings = new SettingsManager(
    new IndexedDBStorage('crystal-courier-' + kind + '-settings'),
    game.preferences,
    { courier: actions },
    { signal },
  );
  const files = new PortableSaveFiles(saves, {
    slot: 'checkpoint',
    validateCandidate: async (record, active) => {
      active.throwIfAborted();
      if (mode() !== 'menu')
        throw new Error('Checkpoint imports require the menu.');
      validateCandidate(record);
    },
  });
  const owner = new AbortController();
  const lifetime = AbortSignal.any([signal, owner.signal]);
  const root = document.createElement('fieldset');
  root.id = 'portable-settings';
  root.disabled = true;
  root.innerHTML = `<legend>Accessibility / 無障礙</legend>
    <label>Text scale / 文字比例 <input id="text-scale" type="range" min="1" max="2" step="0.1"></label>
    <label><input id="high-contrast" type="checkbox"> High contrast / 高對比</label>
    <label><input id="reduced-motion" type="checkbox"> Reduced motion / 減少動態</label>
    <label>Action / 動作 <select id="binding-action"><option>up</option><option>down</option><option>left</option><option>right</option><option>jump</option></select></label>
    <label>Key / 按鍵 <input id="binding-key" readonly placeholder="Focus and press a key / 聚焦並按鍵"></label>
    <button id="reset-settings" type="button">Reset settings / 重設</button>
    <label>Import settings / 匯入設定 <input id="import-settings" type="file" accept="application/json,.json"></label>
    <button id="prepare-settings" type="button">Prepare settings download / 準備下載設定</button>
    <button id="download-settings" type="button" disabled>Download settings / 下載設定</button>
    <p id="settings-status" role="status" aria-live="polite"></p>`;
  document.getElementById('settings-panel')!.append(root);
  const transfers = document.createElement('fieldset');
  transfers.id = 'portable-checkpoint';
  transfers.innerHTML = `<legend>Portable checkpoint / 攜帶存檔</legend>
    <button id="prepare-checkpoint" type="button">Prepare checkpoint download / 準備下載存檔</button>
    <button id="download-checkpoint" type="button" disabled>Download checkpoint / 下載存檔</button>
    <label>Import checkpoint (menu only) / 選單匯入存檔 <input id="import-checkpoint" type="file" accept="application/json,.json"></label>
    <button id="download-rejected" type="button" disabled>Download rejected file / 下載保留的原檔</button>
    <p id="file-status" role="status" aria-live="polite"></p>`;
  document.querySelector('main')!.append(transfers);
  const input = (id: string): HTMLInputElement =>
    document.getElementById(id) as HTMLInputElement;
  const button = (id: string): HTMLButtonElement =>
    document.getElementById(id) as HTMLButtonElement;
  const status = (id: string, value: string): void => {
    if (!lifetime.aborted) document.getElementById(id)!.textContent = value;
  };
  let settingsBlob: Blob | undefined,
    checkpointBlob: Blob | undefined,
    rejectedBlob: Blob | undefined;
  let busy = false,
    cleaned = false;
  let releaseDownload: (() => void) | undefined;
  const main = document.querySelector('main')!;
  const previousFontSize = main.style.fontSize;
  const refresh = (): void => {
    if (lifetime.aborted) return;
    const values = game.preferences.values;
    input('text-scale').value = String(values.textScale);
    input('high-contrast').checked = values.highContrast;
    input('reduced-motion').checked = values.reducedMotion;
    main.style.fontSize = `${values.textScale}em`;
    main.dataset.contrast = String(values.highContrast);
    const action = (
      document.getElementById('binding-action') as HTMLSelectElement
    ).value;
    const bindings = actions.exportBindings();
    input('binding-key').value =
      bindings[action]
        ?.filter((binding) => 'key' in binding)
        .map((binding) => ('key' in binding ? binding.key : ''))
        .join(', ') ?? '';
  };
  const listen = (id: string, type: string, callback: EventListener): void => {
    document
      .getElementById(id)!
      .addEventListener(type, callback, { signal: lifetime });
  };
  const report = (id: string, error: unknown): void => {
    status(id, error instanceof Error ? error.message : String(error));
  };
  const persist = (): void => {
    settingsBlob = undefined;
    button('download-settings').disabled = true;
    void settings
      .save()
      .then(() => status('settings-status', 'Settings saved / 已儲存設定'))
      .catch((error) => report('settings-status', error));
  };
  const render = (current: string): void => {
    const ready =
      !busy && !cleaned && !['loading', 'destroyed'].includes(current);
    root.disabled = !ready;
    button('prepare-checkpoint').disabled = !ready;
    input('import-checkpoint').disabled = !ready || current !== 'menu';
    for (const node of root.querySelectorAll<
      HTMLInputElement | HTMLButtonElement | HTMLSelectElement
    >('input,button,select'))
      node.disabled = !ready;
    button('download-settings').disabled = !ready || !settingsBlob;
    button('download-checkpoint').disabled = !ready || !checkpointBlob;
    button('download-rejected').disabled = !ready || !rejectedBlob;
    refresh();
  };
  listen('text-scale', 'change', () => {
    game.preferences.set({ textScale: Number(input('text-scale').value) });
    refresh();
    persist();
  });
  listen('high-contrast', 'change', () => {
    game.preferences.set({ highContrast: input('high-contrast').checked });
    refresh();
    persist();
  });
  listen('reduced-motion', 'change', () => {
    game.preferences.set({ reducedMotion: input('reduced-motion').checked });
    refresh();
    persist();
  });
  listen('binding-action', 'change', refresh);
  listen('binding-key', 'keydown', ((event: KeyboardEvent) => {
    if (event.code === 'Tab') return;
    event.preventDefault();
    event.stopPropagation();
    const action = (
      document.getElementById('binding-action') as HTMLSelectElement
    ).value;
    actions.rebind(action, [{ key: event.code }]);
    refresh();
    persist();
  }) as EventListener);
  listen('reset-settings', 'click', () => {
    busy = true;
    render(mode());
    void settings
      .reset()
      .then(() => {
        settingsBlob = undefined;
        status('settings-status', 'Settings reset / 已重設設定');
      })
      .catch((error) => report('settings-status', error))
      .finally(() => {
        busy = false;
        if (!cleaned) render(mode());
      });
  });
  listen('prepare-settings', 'click', () => {
    busy = true;
    render(mode());
    void settings
      .exportFile()
      .then((blob) => {
        settingsBlob = blob;
        status('settings-status', 'Ready to download / 可下載');
      })
      .catch((error) => report('settings-status', error))
      .finally(() => {
        busy = false;
        if (!cleaned) render(mode());
      });
  });
  listen('prepare-checkpoint', 'click', () => {
    busy = true;
    render(mode());
    void files
      .exportFile(lifetime)
      .then((blob) => {
        checkpointBlob = blob;
        status('file-status', 'Ready to download / 可下載');
      })
      .catch((error) => report('file-status', error))
      .finally(() => {
        busy = false;
        if (!cleaned) render(mode());
      });
  });
  for (const [id, getBlob, filename] of [
    ['download-settings', () => settingsBlob, 'courier-settings.json'],
    ['download-checkpoint', () => checkpointBlob, `courier-${kind}.json`],
    ['download-rejected', () => rejectedBlob, 'rejected-original.json'],
  ] as const)
    listen(id, 'click', () => {
      const blob = getBlob();
      if (blob) {
        releaseDownload?.();
        releaseDownload = downloadSaveFile(blob, filename);
      }
    });
  for (const id of ['import-settings', 'import-checkpoint'])
    listen(id, 'change', () => {
      const file = input(id).files?.[0];
      if (!file || busy || (id === 'import-checkpoint' && mode() !== 'menu'))
        return;
      busy = true;
      render(mode());
      const operation =
        id === 'import-settings'
          ? settings.importFile(file)
          : files.importFile(file, { signal: lifetime }).then((record) => {
              lifetime.throwIfAborted();
              const data = record.data;
              if (
                !data ||
                typeof data !== 'object' ||
                Array.isArray(data) ||
                !('checkpoint' in data)
              )
                throw new Error('Validated checkpoint is missing.');
              const checkpoint = data.checkpoint as unknown as Checkpoint;
              imported(checkpoint);
            });
      void operation
        .then(() => {
          settingsBlob = undefined;
          checkpointBlob = undefined;
          status(
            id === 'import-settings' ? 'settings-status' : 'file-status',
            'Imported / 已匯入',
          );
        })
        .catch(async (error) => {
          if (lifetime.aborted) return;
          rejectedBlob = file;
          report(
            id === 'import-settings' ? 'settings-status' : 'file-status',
            error,
          );
          if (id === 'import-checkpoint') {
            try {
              const raw = await readSaveFile(file, lifetime);
              if (!lifetime.aborted) {
                (
                  document.getElementById('raw-save') as HTMLTextAreaElement
                ).value = raw;
                document.getElementById('raw-panel')!.hidden = false;
              }
            } catch {
              /* Oversized input remains available as the original file. */
            }
          }
        })
        .finally(() => {
          busy = false;
          if (!cleaned) {
            input(id).value = '';
            render(mode());
          }
        });
    });
  const destroy = (): void => {
    if (cleaned) return;
    cleaned = true;
    owner.abort();
    settings.destroy();
    files.destroy();
    actions.destroy();
    controls.actions = undefined;
    releaseDownload?.();
    signal.removeEventListener('abort', destroy);
    root.remove();
    transfers.remove();
    main.style.fontSize = previousFontSize;
    delete main.dataset.contrast;
  };
  signal.addEventListener('abort', destroy, { once: true });
  try {
    const loaded = await settings.load();
    lifetime.throwIfAborted();
    if (loaded.status === 'corrupt') report('settings-status', loaded.error);
    refresh();
    return {
      get busy() {
        return busy;
      },
      render,
      destroy,
    };
  } catch (error) {
    if (lifetime.aborted) {
      destroy();
      throw error;
    }
    report('settings-status', error);
    return {
      get busy() {
        return busy;
      },
      render,
      destroy,
    };
  }
}

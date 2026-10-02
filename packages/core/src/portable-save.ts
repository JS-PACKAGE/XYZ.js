import { storageLimits } from '../../../src/data/storage.js';
import { subscribeLoad } from '../../assets/src/preload/subscribe-load.js';
import {
  StorageError,
  type SaveManager,
  type SaveRecord,
  type SaveWriteOptions,
} from './storage.js';

/** Checks before allocating/decoding file contents; the caller retains the original Blob. */
export async function readSaveFile(
  file: Blob,
  signal?: AbortSignal,
): Promise<string> {
  signal?.throwIfAborted();
  if (file.size > storageLimits.maxBytes)
    throw new StorageError(
      'size',
      `Save exceeds ${storageLimits.maxBytes} bytes.`,
    );
  const raw = await subscribeLoad(file.text(), signal);
  signal?.throwIfAborted();
  return raw;
}

export interface PortableSaveOptions {
  readonly slot: string;
  /** Build, restore and dispose a fresh candidate here. Never write into a live scene. */
  readonly validateCandidate: (
    record: SaveRecord,
    signal: AbortSignal,
  ) => Promise<void>;
}

/** File migration and fresh-candidate preflight precede the existing durable CAS transaction.
 * Successful imports return a checkpoint for the owner's separate guarded scene publication.
 * Neither failed imports nor superseded preflight work mutate a slot. */
export class PortableSaveFiles {
  private pending?: AbortController;
  private readonly lifetime = new AbortController();
  constructor(
    private readonly saves: SaveManager,
    private readonly options: PortableSaveOptions,
  ) {}

  async exportFile(signal?: AbortSignal): Promise<Blob> {
    const combined = signal
      ? AbortSignal.any([signal, this.lifetime.signal])
      : this.lifetime.signal;
    combined.throwIfAborted();
    const raw = await this.saves.export(this.options.slot, {
      signal: combined,
    });
    combined.throwIfAborted();
    return new Blob([raw], { type: 'application/json' });
  }

  async importFile(
    file: Blob,
    options: SaveWriteOptions = {},
  ): Promise<SaveRecord> {
    this.lifetime.signal.throwIfAborted();
    this.pending?.abort(
      new DOMException('File import was superseded.', 'AbortError'),
    );
    const pending = new AbortController();
    this.pending = pending;
    const signal = AbortSignal.any([
      pending.signal,
      this.lifetime.signal,
      ...(options.signal ? [options.signal] : []),
    ]);
    try {
      const current = await this.saves.load(this.options.slot, { signal });
      if (current.status === 'corrupt') throw current.error;
      const expectedRevision =
        options.expectedRevision ??
        this.saves.observedRevision(this.options.slot);
      const raw = await readSaveFile(file, signal);
      const record = await this.saves.decodeImport(raw, { signal });
      await subscribeLoad(
        this.options.validateCandidate(record, signal),
        signal,
      );
      signal.throwIfAborted();
      return await this.saves.save(
        this.options.slot,
        record.data,
        record.metadata.playTime,
        { ...options, expectedRevision, signal },
      );
    } finally {
      if (this.pending === pending) this.pending = undefined;
    }
  }

  destroy(): void {
    this.lifetime.abort(
      new DOMException('Portable save owner is destroyed.', 'AbortError'),
    );
    this.pending?.abort(this.lifetime.signal.reason);
  }
}

/** Call from a trusted click after preparing the Blob. Return ownership of URL cleanup. */
export function downloadSaveFile(
  file: Blob,
  filename: string,
  document: Document = globalThis.document,
): () => void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  try {
    link.click();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    link.remove();
  }
  return () => URL.revokeObjectURL(url);
}

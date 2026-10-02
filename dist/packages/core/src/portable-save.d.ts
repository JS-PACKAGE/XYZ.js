import { type SaveManager, type SaveRecord, type SaveWriteOptions } from './storage.js';
/** Checks before allocating/decoding file contents; the caller retains the original Blob. */
export declare function readSaveFile(file: Blob, signal?: AbortSignal): Promise<string>;
export interface PortableSaveOptions {
    readonly slot: string;
    /** Build, restore and dispose a fresh candidate here. Never write into a live scene. */
    readonly validateCandidate: (record: SaveRecord, signal: AbortSignal) => Promise<void>;
}
/** File migration and fresh-candidate preflight precede the existing durable CAS transaction.
 * Successful imports return a checkpoint for the owner's separate guarded scene publication.
 * Neither failed imports nor superseded preflight work mutate a slot. */
export declare class PortableSaveFiles {
    private readonly saves;
    private readonly options;
    private pending?;
    private readonly lifetime;
    constructor(saves: SaveManager, options: PortableSaveOptions);
    exportFile(signal?: AbortSignal): Promise<Blob>;
    importFile(file: Blob, options?: SaveWriteOptions): Promise<SaveRecord>;
    destroy(): void;
}
/** Call from a trusted click after preparing the Blob. Return ownership of URL cleanup. */
export declare function downloadSaveFile(file: Blob, filename: string, document?: Document): () => void;

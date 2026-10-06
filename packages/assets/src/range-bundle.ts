import { AssetError } from './texture.js';
import { readResponse } from './read-response.js';
import { assetRecipe } from '../../../src/data/asset-recipe.js';
import type { AssetBundleDescriptor } from './asset-bundle.js';

export interface AssetBundleArchiveMember {
  readonly path: string;
  readonly offset: number;
  readonly bytes: number;
}
export interface AssetBundleArchive {
  readonly path: string;
  readonly bytes: number;
  readonly members: readonly AssetBundleArchiveMember[];
}
/** Archive offsets address uncompressed bytes in a plain concatenated archive, not ZIP entries. */
export function parseAssetBundleArchive(
  value: unknown,
  descriptor: AssetBundleDescriptor,
): AssetBundleArchive {
  if (!value || typeof value !== 'object')
    throw new AssetError('Missing bundle archive manifest.');
  const archive = value as Record<string, unknown>;
  if (
    typeof archive.path !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(archive.path) ||
    !Number.isSafeInteger(archive.bytes) ||
    (archive.bytes as number) < 1 ||
    (archive.bytes as number) > assetRecipe.outputBytes ||
    !Array.isArray(archive.members) ||
    archive.members.length !== descriptor.files.length
  )
    throw new AssetError('Invalid bundle archive manifest.');
  const files = new Map(
    descriptor.files.map((file) => [file.path, file.bytes]),
  );
  const paths = new Set<string>();
  const members = archive.members.map((value: unknown) => {
    if (!value || typeof value !== 'object')
      throw new AssetError('Invalid archive member.');
    const member = value as Record<string, unknown>;
    if (
      typeof member.path !== 'string' ||
      paths.has(member.path) ||
      !files.has(member.path) ||
      member.bytes !== files.get(member.path) ||
      !Number.isSafeInteger(member.offset) ||
      (member.offset as number) < 0 ||
      (member.offset as number) + (member.bytes as number) >
        (archive.bytes as number)
    )
      throw new AssetError('Invalid archive member offset/size.');
    paths.add(member.path);
    return Object.freeze({
      path: member.path,
      offset: member.offset as number,
      bytes: member.bytes as number,
    });
  });
  const sorted = [...members].sort((a, b) => a.offset - b.offset);
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i]!.offset < sorted[i - 1]!.offset + sorted[i - 1]!.bytes)
      throw new AssetError('Overlapping archive members.');
  return Object.freeze({
    path: archive.path,
    bytes: archive.bytes as number,
    members: Object.freeze(members),
  });
}

/** One load owns this reader: a 200 response is retained once, bounded by archive.bytes. */
export class AssetBundleRangeReader {
  private readonly controller = new AbortController();
  private full: Promise<ArrayBuffer> | undefined;
  private readonly members: ReadonlyMap<string, AssetBundleArchiveMember>;
  private readonly abort: () => void;
  private destroyed = false;
  public constructor(
    private readonly url: string,
    private readonly archive: AssetBundleArchive,
    private readonly signal?: AbortSignal,
  ) {
    this.members = new Map(
      archive.members.map((member) => [member.path, member]),
    );
    this.abort = () => this.controller.abort(signal?.reason);
    signal?.addEventListener('abort', this.abort, { once: true });
    if (signal?.aborted) this.abort();
  }
  public async read(path: string): Promise<ArrayBuffer> {
    if (this.destroyed)
      throw new AssetError('Bundle range reader is destroyed.');
    const signal = this.controller.signal;
    signal.throwIfAborted();
    const member = this.members.get(path);
    if (!member) throw new AssetError('Untracked archive member.');
    if (!member.bytes) return new ArrayBuffer(0);
    if (this.full)
      return (await this.full).slice(
        member.offset,
        member.offset + member.bytes,
      );
    const response = await fetch(this.url, {
      signal,
      headers: {
        Range: `bytes=${member.offset}-${member.offset + member.bytes - 1}`,
      },
    });
    if (response.status === 206) {
      if (
        response.headers.get('Content-Range') !==
        `bytes ${member.offset}-${member.offset + member.bytes - 1}/${this.archive.bytes}`
      ) {
        await response.body?.cancel();
        throw new AssetError('Invalid archive Content-Range.');
      }
      const bytes = await (
        await readResponse(response, member.bytes, signal)
      ).arrayBuffer();
      if (bytes.byteLength !== member.bytes)
        throw new AssetError('Truncated archive range.');
      return bytes;
    }
    if (response.status === 200) {
      if (this.full) await response.body?.cancel();
      else this.full = this.readFull(response);
      const bytes = await this.full;
      signal.throwIfAborted();
      return bytes.slice(member.offset, member.offset + member.bytes);
    }
    await response.body?.cancel();
    if (
      response.status === 405 ||
      response.status === 416 ||
      response.status === 501
    ) {
      this.full ??= fetch(this.url, { signal }).then((response) =>
        this.readFull(response),
      );
      return (await this.full).slice(
        member.offset,
        member.offset + member.bytes,
      );
    }
    throw new AssetError(
      `Archive range request failed (HTTP ${response.status}).`,
    );
  }
  private async readFull(response: Response): Promise<ArrayBuffer> {
    if (response.status !== 200) {
      await response.body?.cancel();
      throw new AssetError(
        `Archive full request failed (HTTP ${response.status}).`,
      );
    }
    const bytes = await (
      await readResponse(response, this.archive.bytes, this.controller.signal)
    ).arrayBuffer();
    if (bytes.byteLength !== this.archive.bytes)
      throw new AssetError('Truncated full archive.');
    return bytes;
  }
  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.signal?.removeEventListener('abort', this.abort);
    this.controller.abort();
    this.full = undefined;
  }
}

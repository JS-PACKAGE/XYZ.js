/** Counts decoded response bytes, not the potentially missing/compressed Content-Length. */
export async function readResponse(
  response: Response,
  limit: number,
  signal: AbortSignal,
): Promise<Blob> {
  signal.throwIfAborted();
  if (!response.body) return new Blob();
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > limit)
        throw new RangeError(`Asset response exceeds ${limit} bytes.`);
      if (value.byteLength) chunks.push(value);
    }
    return new Blob(chunks, {
      type: response.headers.get('Content-Type') ?? '',
    });
  } catch (error) {
    cancel();
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

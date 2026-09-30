import { describe, expect, it } from 'vitest';
import { readResponse } from '../packages/assets/src/read-response.js';

describe('bounded asset response', () => {
  it('preserves bytes at the exact limit across chunks without a length header', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.close();
      },
    });
    const blob = await readResponse(
      new Response(stream),
      4,
      new AbortController().signal,
    );
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3, 4]),
    );
  });

  it('cancels on overflow despite an understated Content-Length', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(3));
        controller.enqueue(new Uint8Array(2));
      },
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      readResponse(
        new Response(stream, { headers: { 'Content-Length': '1' } }),
        4,
        new AbortController().signal,
      ),
    ).rejects.toThrow('exceeds');
    expect(cancelled).toBe(true);
  });

  it('aborts a stalled stream rather than accepting a truncated asset', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });
    const controller = new AbortController();
    const reading = readResponse(new Response(stream), 4, controller.signal);
    controller.abort();
    await expect(reading).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancelled).toBe(true);
  });
});

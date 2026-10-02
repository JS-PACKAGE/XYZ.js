/* global window, document, AudioNode, AudioDestinationNode, HTMLMediaElement, MutationObserver, getComputedStyle, location, Request, Headers, Blob, crypto */
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname, join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { URL } from 'node:url';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { Buffer } from 'node:buffer';

/** No source transforms, SPA fallback, shared port, or files outside the output tree. */
export async function staticSiteServer(directory) {
  const root = await realpath(directory);
  const requests = [];
  const server = createServer(async (request, response) => {
    const record = {
      url: request.url,
      method: request.method,
      requestId: request.headers['x-xyz-deployment-request'],
      startedAt: Date.now(),
      status: 0,
      finished: false,
    };
    requests.push(record);
    response.on('finish', () => {
      record.finished = true;
      record.finishedAt = Date.now();
    });
    response.on('close', () => {
      if (!record.finished) record.closedBeforeFinish = true;
    });
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405);
        response.end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
      if (pathname.includes('\0')) throw new Error('Invalid path');
      let path = resolve(root, `.${pathname}`);
      const inside = (value) => {
        const rel = relative(root, value);
        return (
          rel !== '..' &&
          !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) &&
          !isAbsolute(rel)
        );
      };
      if (!inside(path)) throw new Error('Path outside website');
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      path = await realpath(path);
      if (!inside(path) || !(await stat(path)).isFile())
        throw new Error('Not a website file');
      const mime =
        {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.mjs': 'text/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json',
          '.wasm': 'application/wasm',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
          '.ico': 'image/x-icon',
          '.wav': 'audio/wav',
          '.mp3': 'audio/mpeg',
          '.ogg': 'audio/ogg',
          '.mp4': 'video/mp4',
          '.ttf': 'font/ttf',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.gltf': 'model/gltf+json',
          '.glb': 'model/gltf-binary',
          '.ktx2': 'image/ktx2',
          '.txt': 'text/plain; charset=utf-8',
        }[extname(path).toLowerCase()] ?? 'application/octet-stream';
      const metadata = await stat(path);
      const payload =
        request.method === 'HEAD' ? undefined : await readFile(path);
      if (payload) {
        record.bytes = payload.byteLength;
        record.sha256 = createHash('sha256').update(payload).digest('hex');
      }
      response.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': metadata.size,
        'Cache-Control': 'no-store',
      });
      response.end(payload);
    } catch (error) {
      record.error = String(error);
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not found');
    } finally {
      record.status = response.statusCode;
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    requests,
    close: () =>
      new Promise((resolveClose, reject) => {
        server.close((error) => (error ? reject(error) : resolveClose()));
        server.closeIdleConnections();
      }),
  };
}

/** Installed before any page script; real graphs stay upstream of a private native zero-gain sink. */
export function installSilentSurface() {
  const state = {
    directMediaPlays: 0,
    routedMediaPlays: 0,
    workers: [],
    rejections: [],
    gestures: [],
    canvas: [],
    fetches: [],
    fetchHashes: [],
  };
  const contexts = [],
    sinkNodes = [];
  Object.defineProperty(window, '__xyzSiteSmoke', { value: state });
  // Reuse the P60 same-request, exact-byte EOF observation; never hide real aborts.
  const nativeFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = new window.URL(
      input instanceof Request ? input.url : input,
      location.href,
    );
    if (url.origin !== location.origin) return nativeFetch(input, init);
    const method =
      init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (method !== 'GET') return nativeFetch(input, init);
    const entry = {
      requestId: `deployment-${crypto.randomUUID()}`,
      url: url.href,
      startedAt: Date.now(),
      abortedAt: null,
      canceledAt: null,
    };
    state.fetches.push(entry);
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set('X-XYZ-Deployment-Request', entry.requestId);
    const signal =
      init?.signal ?? (input instanceof Request ? input.signal : undefined);
    if (signal?.aborted) entry.abortedAt = Date.now();
    signal?.addEventListener(
      'abort',
      () => {
        entry.abortedAt = Date.now();
      },
      { once: true },
    );
    const response = await nativeFetch(input, { ...init, headers });
    entry.status = response.status;
    if (response.body) {
      const getReader = response.body.getReader.bind(response.body);
      response.body.getReader = (...args) => {
        const reader = getReader(...args);
        const read = reader.read.bind(reader),
          cancel = reader.cancel.bind(reader),
          chunks = [];
        reader.read = (...args) =>
          read(...args).then((result) => {
            if (result.value) chunks.push(result.value);
            if (result.done) {
              entry.completedAt = Date.now();
              state.fetchHashes.push(
                (async () => {
                  const bytes = await new Blob(chunks).arrayBuffer();
                  entry.bytes = bytes.byteLength;
                  entry.sha256 = [
                    ...new Uint8Array(
                      await crypto.subtle.digest('SHA-256', bytes),
                    ),
                  ]
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join('');
                })(),
              );
            }
            return result;
          });
        reader.cancel = (...args) => {
          entry.canceledAt = Date.now();
          return cancel(...args);
        };
        return reader;
      };
    }
    return response;
  };
  const sinks = new WeakMap();
  const nativeConnect = AudioNode.prototype.connect;
  const nativeDisconnect = AudioNode.prototype.disconnect;
  const NativeAudioContext = window.AudioContext;
  const nativeGain = NativeAudioContext.prototype.createGain;
  const sinkFor = (destination) => {
    let sink = sinks.get(destination);
    if (!sink) {
      sink = nativeGain.call(destination.context);
      sink.gain.setValueAtTime(0, 0);
      sink.gain.value = 0;
      nativeConnect.call(sink, destination);
      sinks.set(destination, sink);
      sinkNodes.push(sink);
    }
    return sink;
  };
  AudioNode.prototype.connect = function (destination, ...indices) {
    if (
      destination instanceof AudioDestinationNode &&
      destination === destination.context.destination
    ) {
      nativeConnect.call(this, sinkFor(destination), ...indices);
      return destination;
    }
    return nativeConnect.call(this, destination, ...indices);
  };
  AudioNode.prototype.disconnect = function (...args) {
    if (args[0] instanceof AudioDestinationNode && sinks.has(args[0]))
      args[0] = sinks.get(args[0]);
    return nativeDisconnect.apply(this, args);
  };
  const wrapContext = (Native) =>
    new Proxy(Native, {
      construct(target, args, newTarget) {
        const context = Reflect.construct(target, args, newTarget);
        contexts.push(context);
        sinkFor(context.destination);
        return context;
      },
    });
  window.AudioContext = wrapContext(NativeAudioContext);
  if (window.webkitAudioContext)
    window.webkitAudioContext = wrapContext(window.webkitAudioContext);
  const routed = new WeakSet();
  Object.defineProperty(state, 'audioSafety', {
    get: () => ({
      nativeContexts: contexts.length,
      contextStates: contexts.map((context) => context.state),
      zeroGainDestinations: sinkNodes.length,
      gains: sinkNodes.map((sink) => sink.gain.value),
      directMediaPlays: state.directMediaPlays,
      routedMediaPlays: state.routedMediaPlays,
      directDOMMediaMuted: [...document.querySelectorAll('audio,video')]
        .filter((media) => !routed.has(media))
        .every((media) => media.muted),
    }),
  });
  const nativeMediaSource =
    NativeAudioContext.prototype.createMediaElementSource;
  NativeAudioContext.prototype.createMediaElementSource = function (media) {
    const source = nativeMediaSource.call(this, media);
    routed.add(media);
    return source;
  };
  const muted = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'muted',
  );
  Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
    ...muted,
    set(value) {
      muted.set.call(this, routed.has(this) ? value : true);
    },
  });
  const muteDirectMedia = () => {
    for (const media of document.querySelectorAll('audio,video')) {
      if (!routed.has(media)) muted.set.call(media, true);
    }
  };
  const NativeAudio = window.Audio;
  window.Audio = new Proxy(NativeAudio, {
    construct(target, args, newTarget) {
      const media = Reflect.construct(target, args, newTarget);
      muted.set.call(media, true);
      return media;
    },
  });
  const autoplay = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'autoplay',
  );
  Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', {
    ...autoplay,
    set(value) {
      if (!routed.has(this)) muted.set.call(this, true);
      autoplay.set.call(this, value);
    },
  });
  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    if (routed.has(this)) state.routedMediaPlays++;
    else {
      state.directMediaPlays++;
      muted.set.call(this, true);
    }
    return nativePlay.apply(this, args);
  };
  new MutationObserver(muteDirectMedia).observe(document, {
    subtree: true,
    childList: true,
  });
  document.addEventListener('DOMContentLoaded', muteDirectMedia);
  window.addEventListener('unhandledrejection', (event) =>
    state.rejections.push(String(event.reason?.stack ?? event.reason)),
  );
  document.addEventListener(
    'click',
    (event) =>
      state.gestures.push({
        trusted: event.isTrusted,
        id: event.target?.id ?? '',
        text: event.target?.textContent?.slice(0, 160) ?? '',
      }),
    true,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      state.gestures.push({
        trusted: event.isTrusted,
        id: event.target?.id ?? '',
        text: event.target?.textContent?.slice(0, 160) ?? '',
        key: event.key,
      });
    },
    true,
  );
  const nativeGetContext = window.HTMLCanvasElement.prototype.getContext;
  window.HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const context = nativeGetContext.call(this, type, ...args);
    if (
      context &&
      this.isConnected &&
      !state.canvas.some(
        (record) => record.element === this && record.type === type,
      )
    )
      state.canvas.push({ element: this, type });
    return context;
  };
  const NativeWorker = window.Worker;
  window.Worker = new Proxy(NativeWorker, {
    construct(target, args, newTarget) {
      const worker = Reflect.construct(target, args, newTarget);
      const record = {
        url: String(args[0]),
        type: args[1]?.type ?? 'classic',
        messages: 0,
        errors: [],
      };
      state.workers.push(record);
      worker.addEventListener('message', () => record.messages++);
      worker.addEventListener('error', (event) =>
        record.errors.push({
          message: event.message,
          filename: event.filename,
          line: event.lineno,
        }),
      );
      worker.addEventListener('messageerror', () =>
        record.errors.push({
          message: 'Worker message deserialization failed',
        }),
      );
      return worker;
    },
  });
}

/** Read the browser compositor PNG, not a second renderer or a synthetic canvas. */
export function pngPixels(png) {
  if (
    !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new Error('Screenshot is not PNG');
  let width, height, channels;
  const payload = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset),
      type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || ![2, 6].includes(data[9]) || data[12] !== 0)
        throw new Error('Unsupported screenshot PNG format');
      channels = data[9] === 6 ? 4 : 3;
    }
    if (type === 'IDAT') payload.push(data);
    offset += length + 12;
  }
  if (!width || !height || !channels)
    throw new Error('PNG has no backing pixels');
  const raw = inflateSync(Buffer.concat(payload)),
    stride = width * channels;
  if (raw.length !== (stride + 1) * height)
    throw new Error('PNG raster length mismatch');
  let previous = Buffer.alloc(stride),
    current = Buffer.alloc(stride);
  const colors = new Set();
  let visible = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const offset = y * (stride + 1),
      filter = raw[offset];
    if (filter > 4) throw new Error('Unsupported PNG row filter');
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? current[x - channels] : 0,
        b = previous[x],
        c = x >= channels ? previous[x - channels] : 0;
      current[x] =
        (raw[offset + 1 + x] +
          [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter]) &
        255;
    }
    for (let x = 0; x < stride; x += channels) {
      if (channels === 3 || current[x + 3]) {
        visible++;
        if (colors.size < 65536)
          colors.add(
            (current[x] << 16) | (current[x + 1] << 8) | current[x + 2],
          );
      }
    }
    [previous, current] = [current, previous];
  }
  return {
    width,
    height,
    visiblePixels: visible,
    distinctRGB: colors.size,
    nonuniform: colors.size > 1,
    sha256: createHash('sha256').update(png).digest('hex'),
  };
}

export async function surfaceDOM(page) {
  return page.evaluate(() => {
    const state = window.__xyzSiteSmoke;
    const visible = (element) =>
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden' &&
      getComputedStyle(element).display !== 'none';
    return {
      title: document.title,
      url: location.href,
      readyState: document.readyState,
      text: document.body?.innerText ?? '',
      statuses: [
        ...document.querySelectorAll(
          '[role="status"],output,#status,#stats,#boot,#notice,#report',
        ),
      ].map((element) => ({
        id: element.id,
        state: element.getAttribute('data-state'),
        text: element.textContent,
        visible: visible(element),
      })),
      links: [...document.querySelectorAll('a[href]')].map((element) => ({
        href: element.href,
        text: element.textContent,
        visible: visible(element),
      })),
      controls: [
        ...document.querySelectorAll('button,input,select,[role="button"]'),
      ].map((element) => ({
        tag: element.tagName,
        id: element.id,
        text: element.textContent,
        label: element.getAttribute('aria-label'),
        disabled: !!element.disabled,
        visible: visible(element),
      })),
      canvases: [...document.querySelectorAll('canvas')].map((element) => ({
        id: element.id,
        width: element.width,
        height: element.height,
        visible: visible(element),
        contexts: state.canvas
          .filter((record) => record.element === element)
          .map((record) => record.type),
      })),
      audioSafety: state.audioSafety,
      workers: state.workers,
      rejections: state.rejections,
      gestures: state.gestures,
    };
  });
}

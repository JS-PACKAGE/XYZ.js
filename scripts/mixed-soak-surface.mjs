/* global window, AudioNode, AudioDestinationNode, GPUAdapter, performance */
/** Owned disposable page only. Native graphs remain upstream of private zero-gain sinks. */
export function installMixedSoakSurface() {
  const contexts = [];
  const sinks = new WeakMap();
  const sinkNodes = [];
  const activeSources = new Set();
  const errors = [];
  const devices = { created: 0, lost: 0, current: null, tail: [] };
  let errorCount = 0;
  let sourcesStarted = 0;
  let sourcesEnded = 0;
  const retain = (list, value) => {
    list.push(value);
    if (list.length > 32) list.shift();
  };
  const recordError = (error) => {
    errorCount++;
    retain(errors, String(error));
  };
  window.addEventListener('unhandledrejection', (event) =>
    recordError(event.reason),
  );
  const Native = window.AudioContext;
  const connect = AudioNode.prototype.connect;
  const disconnect = AudioNode.prototype.disconnect;
  const createGain = Native.prototype.createGain;
  const sinkFor = (destination) => {
    let sink = sinks.get(destination);
    if (!sink) {
      sink = createGain.call(destination.context);
      sink.gain.setValueAtTime(0, 0);
      sink.gain.value = 0;
      connect.call(sink, destination);
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
      connect.call(this, sinkFor(destination), ...indices);
      return destination;
    }
    return connect.call(this, destination, ...indices);
  };
  AudioNode.prototype.disconnect = function (...args) {
    if (args[0] instanceof AudioDestinationNode && sinks.has(args[0]))
      args[0] = sinks.get(args[0]);
    return disconnect.apply(this, args);
  };
  const createSource = Native.prototype.createBufferSource;
  Native.prototype.createBufferSource = function (...args) {
    const source = createSource.apply(this, args);
    const start = source.start;
    source.start = function (...startArgs) {
      const result = start.apply(this, startArgs);
      sourcesStarted++;
      activeSources.add(source);
      return result;
    };
    source.addEventListener(
      'ended',
      () => {
        if (activeSources.delete(source)) sourcesEnded++;
      },
      { once: true },
    );
    return source;
  };
  const wrapContext = (Constructor) =>
    new Proxy(Constructor, {
      construct(target, args, newTarget) {
        const context = Reflect.construct(target, args, newTarget);
        contexts.push(context);
        sinkFor(context.destination);
        return context;
      },
    });
  window.AudioContext = wrapContext(Native);
  if (window.webkitAudioContext)
    window.webkitAudioContext = wrapContext(window.webkitAudioContext);
  if (typeof GPUAdapter !== 'undefined') {
    const requestDevice = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...args) {
      const device = await requestDevice.apply(this, args);
      devices.created++;
      devices.current = device;
      device.addEventListener('uncapturederror', (event) =>
        recordError(event.error),
      );
      device.lost.then((info) => {
        devices.lost++;
        if (devices.current === device) devices.current = null;
        retain(devices.tail, {
          milliseconds: performance.now(),
          reason: info.reason,
          message: info.message,
        });
      });
      return device;
    };
  }
  Object.defineProperty(window, '__xyzMixedNative', {
    value: {
      snapshot: () => ({
        nativeContexts: contexts.length,
        contextStates: contexts.map((context) => context.state),
        zeroGainDestinations: sinkNodes.length,
        gains: sinkNodes.map((sink) => sink.gain.value),
        sourcesStarted,
        sourcesEnded,
        activeSources: activeSources.size,
        errorCount,
        errors: errors.slice(),
        gpuDevicesCreated: devices.created,
        gpuDevicesLost: devices.lost,
        deviceLossTail: devices.tail.slice(),
      }),
      loseOwnedDevice: () => {
        if (!devices.current)
          throw new Error(
            'No owned native GPUDevice available for API-loss qualification.',
          );
        devices.current.destroy();
      },
    },
  });
}

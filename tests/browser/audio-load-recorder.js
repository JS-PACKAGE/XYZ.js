/* global AudioWorkletProcessor, registerProcessor, currentTime, sampleRate */
class AudioLoadRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.enabled = false;
    this.samples = 0;
    this.maxError = 0;
    this.energy = [0, 0];
    this.peak = null;
    this.port.onmessage = ({ data }) => {
      if (data === 'start') this.enabled = true;
      if (data === 'stop') {
        this.enabled = false;
        this.port.postMessage({
          samples: this.samples,
          nativeReferenceMaxError: this.maxError,
          rms: this.energy.map((value) =>
            Math.sqrt(value / Math.max(1, this.samples)),
          ),
          peak: this.peak,
          sampleRate,
        });
      }
    };
  }
  process(inputs, outputs) {
    outputs[0]?.[0]?.fill(0);
    const actual = inputs[0]?.[0],
      reference = inputs[1]?.[0];
    if (this.enabled && actual && reference) {
      for (let i = 0; i < actual.length; i++) {
        const difference = Math.abs(actual[i] - reference[i]);
        if (difference > this.maxError) {
          this.maxError = difference;
          this.peak = {
            time: currentTime + i / sampleRate,
            actual: actual[i],
            reference: reference[i],
          };
        }
        this.energy[0] += actual[i] * actual[i];
        this.energy[1] += reference[i] * reference[i];
        this.samples++;
      }
    }
    return true;
  }
}
registerProcessor('xyz-audio-load-recorder', AudioLoadRecorder);

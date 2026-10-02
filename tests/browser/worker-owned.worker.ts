import { installWorkerJobs } from '../../packages/assets/src/worker-job-runtime.js';

installWorkerJobs({
  'owned.bitmap': {
    decode(value) {
      if (typeof value !== 'boolean')
        throw new TypeError('Bitmap failure flag must be boolean.');
      return value;
    },
    execute(fail, context) {
      const canvas = new OffscreenCanvas(16, 16);
      const drawing = canvas.getContext('2d')!;
      drawing.fillStyle = '#7fe5c1';
      drawing.fillRect(0, 0, 16, 16);
      const value = context.own(
        { bitmap: canvas.transferToImageBitmap() },
        (owned) => owned.bitmap.close(),
      );
      if (fail) throw new Error('Owned native bitmap preprocessing failed.');
      return { value, transfer: [value.bitmap], byteLength: 16 * 16 * 4 };
    },
  },
});

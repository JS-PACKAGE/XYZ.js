import { describe, expect, it } from 'vitest';
import {
  formatDebugSample,
  type DebugSample,
} from '../packages/core/src/debug-overlay.js';

const base: DebugSample = {
  fps: 59.94,
  frameMs: 16.68,
  backend: 'webgl2',
  state: 'running',
  logicalSize: [800, 450],
  backingSize: [1600, 900],
  frame: 1200,
  render: {
    meshes: 0,
    culled: 0,
    drawCalls: 0,
    triangles: 0,
    shadowDrawCalls: 0,
  },
  colliders: 12,
  tweens: 2,
  audio: 'locked',
  pointers: 1,
};

describe('formatDebugSample', () => {
  it('prints rate, renderer, canvas sizes and subsystem counts', () => {
    const lines = formatDebugSample(base);
    expect(lines[0]).toBe('59.9 fps · 16.68 ms/frame');
    expect(lines[1]).toBe('webgl2 · running · frame 1200');
    expect(lines[2]).toBe('canvas 800×450 → 1600×900 px');
    expect(lines[3]).toBe('3D idle');
    expect(lines[4]).toBe('physics 12 colliders · tweens 2 · pointers 1');
    expect(lines[5]).toBe('audio locked');
  });

  it('reports 3D counters only when the renderer drew something', () => {
    const lines = formatDebugSample({
      ...base,
      render: {
        meshes: 40,
        culled: 12,
        drawCalls: 28,
        triangles: 9000,
        shadowDrawCalls: 28,
      },
    });
    expect(lines[3]).toBe('3D 40 meshes (12 culled) · 28+28 draws · 9000 tris');
  });
});

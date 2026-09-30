import { Texture } from '../../src/index.js';

export interface FixtureRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const atlasRegions = {
  red: { x: 3, y: 3, width: 16, height: 16 },
  green: { x: 25, y: 4, width: 24, height: 12 },
  blue: { x: 53, y: 5, width: 12, height: 24 },
  particle: { x: 78, y: 3, width: 4, height: 4 },
  cyanTile: { x: 2, y: 38, width: 8, height: 8 },
  orangeTile: { x: 12, y: 38, width: 8, height: 8 },
  violetTile: { x: 22, y: 38, width: 8, height: 8 },
} as const satisfies Record<string, FixtureRegion>;

export const atlasGrid = {
  x: 2,
  y: 38,
  columns: 3,
  rows: 1,
  frameWidth: 8,
  frameHeight: 8,
  spacingX: 2,
  spacingY: 2,
} as const;

export interface AtlasFixture {
  readonly texture: Texture;
  readonly regions: typeof atlasRegions;
  readonly grid: typeof atlasGrid;
}

export const glyphAlphabet = '012AB';
export const glyphRegions = {
  '0': { x: 0, y: 0, width: 8, height: 8 },
  '1': { x: 8, y: 0, width: 8, height: 8 },
  '2': { x: 16, y: 0, width: 8, height: 8 },
  A: { x: 24, y: 0, width: 8, height: 8 },
  B: { x: 32, y: 0, width: 8, height: 8 },
} as const satisfies Record<string, FixtureRegion>;

export interface GlyphFixture {
  readonly texture: Texture;
  readonly alphabet: typeof glyphAlphabet;
  readonly regions: typeof glyphRegions;
  readonly cellWidth: 8;
  readonly cellHeight: 8;
  readonly inkWidth: 5;
  readonly inkHeight: 7;
}

export const panelRegion = { x: 0, y: 0, width: 12, height: 12 } as const;
export const panelMargins = { left: 3, right: 3, top: 3, bottom: 3 } as const;

export interface PanelFixture {
  readonly texture: Texture;
  readonly region: typeof panelRegion;
  readonly margins: typeof panelMargins;
}

type RGB = readonly [number, number, number];
const red: RGB = [255, 0, 0];
const green: RGB = [0, 255, 0];
const blue: RGB = [0, 0, 255];
const yellow: RGB = [255, 255, 0];
const white: RGB = [255, 255, 255];
const black: RGB = [0, 0, 0];
const gray: RGB = [128, 128, 128];
const lightGray: RGB = [160, 160, 160];

function paintPixel(image: ImageData, x: number, y: number, color: RGB): void {
  const offset = (y * image.width + x) * 4;
  image.data[offset] = color[0];
  image.data[offset + 1] = color[1];
  image.data[offset + 2] = color[2];
  image.data[offset + 3] = 255;
}

function paint(image: ImageData, region: FixtureRegion, color: RGB): void {
  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      paintPixel(image, x, y, color);
    }
  }
}

/** Returns an independently owned Texture; the caller must destroy it. */
export async function createAtlasFixture(): Promise<AtlasFixture> {
  const image = new ImageData(96, 64);
  paint(image, atlasRegions.red, red);
  paint(image, { x: 3, y: 3, width: 3, height: 3 }, yellow);
  paint(image, { x: 16, y: 16, width: 3, height: 3 }, black);
  paint(image, atlasRegions.green, green);
  paint(image, { x: 25, y: 4, width: 4, height: 12 }, white);
  paint(image, { x: 45, y: 4, width: 4, height: 12 }, [255, 0, 255]);
  paint(image, atlasRegions.blue, blue);
  for (let y = 0; y < 24; y++) {
    paintPixel(image, 53 + Math.floor(y / 2), 5 + y, white);
  }
  paint(image, atlasRegions.particle, white);
  paint(image, atlasRegions.cyanTile, [0, 255, 255]);
  paint(image, atlasRegions.orangeTile, [255, 128, 0]);
  paint(image, atlasRegions.violetTile, [128, 0, 255]);
  return {
    texture: await Texture.fromImage(image),
    regions: atlasRegions,
    grid: atlasGrid,
  };
}

/** The glyph art is authored here, not copied from an external font. */
const glyphRows = [
  [14, 17, 19, 21, 25, 17, 14],
  [4, 12, 4, 4, 4, 4, 14],
  [14, 17, 1, 2, 4, 8, 31],
  [14, 17, 17, 31, 17, 17, 17],
  [30, 17, 17, 30, 17, 17, 30],
] as const;

/** Returns an independently owned Texture; the caller must destroy it. */
export async function createGlyphFixture(): Promise<GlyphFixture> {
  const image = new ImageData(40, 8);
  for (let glyph = 0; glyph < glyphRows.length; glyph++) {
    const rows = glyphRows[glyph]!;
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < 5; x++) {
        if ((rows[y]! & (1 << (4 - x))) !== 0) {
          paintPixel(image, glyph * 8 + x, y, white);
        }
      }
    }
  }
  return {
    texture: await Texture.fromImage(image),
    alphabet: glyphAlphabet,
    regions: glyphRegions,
    cellWidth: 8,
    cellHeight: 8,
    inkWidth: 5,
    inkHeight: 7,
  };
}

/** Returns an independently owned Texture; the caller must destroy it. */
export async function createPanelFixture(): Promise<PanelFixture> {
  const image = new ImageData(12, 12);
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const border = x < 3 || x >= 9 || y < 3 || y >= 9;
      const even = (x + y) % 2 === 0;
      const color = border ? (even ? white : black) : even ? gray : lightGray;
      paintPixel(image, x, y, color);
    }
  }
  paint(image, { x: 0, y: 0, width: 3, height: 3 }, red);
  paint(image, { x: 9, y: 0, width: 3, height: 3 }, green);
  paint(image, { x: 0, y: 9, width: 3, height: 3 }, blue);
  paint(image, { x: 9, y: 9, width: 3, height: 3 }, yellow);
  return {
    texture: await Texture.fromImage(image),
    region: panelRegion,
    margins: panelMargins,
  };
}

export const pcmToneFormat = {
  sampleRate: 48_000,
  channels: 1,
  bitsPerSample: 16,
  frames: 24_000,
  duration: 0.5,
} as const;

export type ToneFrequency = 440 | 660;

/** Generates a mono PCM16 WAV in memory; no object URL or external asset is created. */
export function createPcm16Wav(frequency: ToneFrequency = 440): ArrayBuffer {
  const { sampleRate, frames } = pcmToneFormat;
  const dataBytes = frames * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeTag = (offset: number, tag: string): void => {
    for (let index = 0; index < tag.length; index++) {
      view.setUint8(offset + index, tag.charCodeAt(index));
    }
  };
  writeTag(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeTag(8, 'WAVE');
  writeTag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeTag(36, 'data');
  view.setUint32(40, dataBytes, true);
  for (let frame = 0; frame < frames; frame++) {
    const envelope = Math.min(1, frame / 480, (frames - 1 - frame) / 480);
    const sample = Math.round(
      32767 *
        0.2 *
        envelope *
        Math.sin((2 * Math.PI * frequency * frame) / sampleRate),
    );
    view.setInt16(44 + frame * 2, sample, true);
  }
  return buffer;
}

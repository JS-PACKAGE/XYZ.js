export interface FixtureRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const webFontFixture = {
  family: 'XYZAbelFixture',
  url: new URL('./assets/Abel-Regular.ttf', import.meta.url).href,
  licenseUrl: new URL('./assets/OFL.txt', import.meta.url).href,
  source:
    'https://github.com/google/fonts/blob/9437b806936896fa1a8c812e561067a5f30f5933/ofl/abel/Abel-Regular.ttf',
  sha256: '8809dcad25318225052f88333e208c5aad4adcb7b2c934c135735ec19aa410b4',
} as const;

export const atlasFixtureFrames = {
  asymmetric: {
    frame: { x: 2, y: 2, w: 12, h: 8 },
    rotated: false,
    trimmed: true,
    spriteSourceSize: { x: 4, y: 3, w: 12, h: 8 },
    sourceSize: { w: 20, h: 16 },
    anchor: { x: 0.5, y: 0.5 },
  },
  rotated: {
    frame: { x: 18, y: 2, w: 8, h: 12 },
    rotated: true,
    trimmed: true,
    spriteSourceSize: { x: 4, y: 3, w: 12, h: 8 },
    sourceSize: { w: 20, h: 16 },
    anchor: { x: 0.5, y: 0.5 },
  },
  panel: {
    frame: { x: 2, y: 18, w: 12, h: 12 },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 12, h: 12 },
    sourceSize: { w: 12, h: 12 },
    borders: { left: 3, top: 3, right: 3, bottom: 3 },
  },
} as const;

export const bitmapFixtureMetrics = {
  lineHeight: 10,
  base: 8,
  glyphs: [
    {
      id: 32,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      xoffset: 0,
      yoffset: 0,
      xadvance: 4,
      page: 0,
      chnl: 15,
    },
    {
      id: 65,
      x: 1,
      y: 1,
      width: 5,
      height: 7,
      xoffset: 0,
      yoffset: 1,
      xadvance: 7,
      page: 0,
      chnl: 15,
    },
    {
      id: 86,
      x: 1,
      y: 1,
      width: 5,
      height: 7,
      xoffset: 1,
      yoffset: 1,
      xadvance: 8,
      page: 1,
      chnl: 15,
    },
    {
      id: 105,
      x: 9,
      y: 1,
      width: 1,
      height: 7,
      xoffset: 1,
      yoffset: 1,
      xadvance: 3,
      page: 0,
      chnl: 15,
    },
    {
      id: 128512,
      x: 9,
      y: 1,
      width: 5,
      height: 7,
      xoffset: 0,
      yoffset: 1,
      xadvance: 6,
      page: 1,
      chnl: 15,
    },
  ],
  kernings: [{ first: 65, second: 86, amount: -2 }],
} as const;

export interface RenderingFixtures {
  readonly atlasUrl: string;
  readonly atlasJsonUrl: string;
  readonly patternUrl: string;
  readonly maskUrl: string;
  readonly fontTextUrl: string;
  readonly fontJsonUrl: string;
  readonly fontPageUrls: readonly [string, string];
  readonly webFontUrl: string;
  dispose(): void;
}

type RGBA = readonly [number, number, number, number];

function pixel(image: ImageData, x: number, y: number, rgba: RGBA): void {
  image.data.set(rgba, (y * image.width + x) * 4);
}

function fill(image: ImageData, rect: FixtureRect, rgba: RGBA): void {
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) pixel(image, x, y, rgba);
  }
}

function asymmetricColor(x: number, y: number): RGBA {
  if (x < 3 && y < 3) return [255, 0, 0, 255];
  if (x >= 9 && y < 3) return [0, 255, 0, 255];
  if (x < 3 && y >= 5) return [0, 0, 255, 255];
  if (x >= 9 && y >= 5) return [255, 255, 0, 255];
  return x === y ? [255, 255, 255, 255] : [0, 255, 255, 255];
}

export function createAtlasPixels(): ImageData {
  const image = new ImageData(32, 32);
  fill(image, { x: 0, y: 0, width: 32, height: 32 }, [255, 0, 255, 255]);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
      const color = asymmetricColor(x, y);
      pixel(image, 2 + x, 2 + y, color);
      // Packed clockwise: original (x,y) becomes (height-1-y,x).
      pixel(image, 18 + 7 - y, 2 + x, color);
    }
  }
  fill(image, { x: 2, y: 18, width: 12, height: 12 }, [255, 255, 255, 255]);
  fill(image, { x: 5, y: 21, width: 6, height: 6 }, [32, 64, 128, 255]);
  fill(image, { x: 2, y: 18, width: 3, height: 3 }, [255, 0, 0, 255]);
  fill(image, { x: 11, y: 18, width: 3, height: 3 }, [0, 255, 0, 255]);
  fill(image, { x: 2, y: 27, width: 3, height: 3 }, [0, 0, 255, 255]);
  fill(image, { x: 11, y: 27, width: 3, height: 3 }, [255, 255, 0, 255]);
  return image;
}

export function createPatternPixels(): ImageData {
  const image = new ImageData(8, 8);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      pixel(
        image,
        x,
        y,
        x < 2 ? [255, 0, 0, 255] : y < 3 ? [0, 255, 0, 255] : [0, 0, 255, 255],
      );
    }
  }
  return image;
}

export function createMaskPixels(): ImageData {
  const image = new ImageData(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Red varies horizontally, alpha vertically; channel selection is observable.
      pixel(image, x, y, [x * 17, 255, 0, y * 17]);
    }
  }
  return image;
}

const authoredGlyphs = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  i: ['1', '0', '1', '1', '1', '1', '1'],
  face: ['01110', '10001', '11011', '10001', '10101', '10001', '01110'],
} as const;

export function createBitmapFontPixels(page: 0 | 1): ImageData {
  const image = new ImageData(16, 16);
  const glyphs =
    page === 0
      ? [
          { rows: authoredGlyphs.A, x: 1 },
          { rows: authoredGlyphs.i, x: 9 },
        ]
      : [
          { rows: authoredGlyphs.V, x: 1 },
          { rows: authoredGlyphs.face, x: 9 },
        ];
  for (const glyph of glyphs) {
    for (let y = 0; y < glyph.rows.length; y++) {
      const row = glyph.rows[y]!;
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '1')
          pixel(image, glyph.x + x, 1 + y, [255, 255, 255, 255]);
      }
    }
  }
  return image;
}

function encodePNG(image: ImageData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Fixture PNG encoding requires Canvas2D');
  context.putImageData(image, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      canvas.width = 0;
      canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error('Fixture PNG encoding failed'));
    }, 'image/png');
  });
}

function bitmapFontJSON(pages: readonly string[]): object {
  return {
    info: {
      face: 'XYZProceduralFixture',
      size: 8,
      bold: 0,
      italic: 0,
      charset: '',
      unicode: 1,
      stretchH: 100,
      smooth: 0,
      aa: 1,
      padding: [0, 0, 0, 0],
      spacing: [0, 0],
    },
    common: {
      lineHeight: 10,
      base: 8,
      scaleW: 16,
      scaleH: 16,
      pages: 2,
      packed: 0,
    },
    pages,
    chars: bitmapFixtureMetrics.glyphs,
    kernings: bitmapFixtureMetrics.kernings,
  };
}

function bitmapFontText(pages: readonly string[]): string {
  return [
    'info face="XYZProceduralFixture" size=8 bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=0 aa=1 padding=0,0,0,0 spacing=0,0',
    'common lineHeight=10 base=8 scaleW=16 scaleH=16 pages=2 packed=0',
    ...pages.map((file, id) => `page id=${id} file="${file}"`),
    `chars count=${bitmapFixtureMetrics.glyphs.length}`,
    ...bitmapFixtureMetrics.glyphs.map(
      (glyph) =>
        `char ${Object.entries(glyph)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ')}`,
    ),
    'kernings count=1',
    'kerning first=65 second=86 amount=-2',
    '',
  ].join('\n');
}

/** Authored pixels/metadata; returned object URLs remain valid until caller disposal. */
export async function createRenderingFixtures(): Promise<RenderingFixtures> {
  const urls: string[] = [];
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    for (const url of urls) URL.revokeObjectURL(url);
    urls.length = 0;
  };
  const urlFor = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    urls.push(url);
    return url;
  };
  try {
    const atlasUrl = urlFor(await encodePNG(createAtlasPixels()));
    const patternUrl = urlFor(await encodePNG(createPatternPixels()));
    const maskUrl = urlFor(await encodePNG(createMaskPixels()));
    const fontPageUrls: readonly [string, string] = [
      urlFor(await encodePNG(createBitmapFontPixels(0))),
      urlFor(await encodePNG(createBitmapFontPixels(1))),
    ];
    const atlasJsonUrl = urlFor(
      new Blob(
        [
          JSON.stringify({
            frames: atlasFixtureFrames,
            animations: { turn: ['asymmetric', 'rotated'] },
            meta: {
              app: 'XYZ procedural fixture',
              image: atlasUrl,
              size: { w: 32, h: 32 },
              scale: '2',
            },
          }),
        ],
        { type: 'application/json' },
      ),
    );
    const fontTextUrl = urlFor(
      new Blob([bitmapFontText(fontPageUrls)], { type: 'text/plain' }),
    );
    const fontJsonUrl = urlFor(
      new Blob([JSON.stringify(bitmapFontJSON(fontPageUrls))], {
        type: 'application/json',
      }),
    );
    return {
      atlasUrl,
      atlasJsonUrl,
      patternUrl,
      maskUrl,
      fontTextUrl,
      fontJsonUrl,
      fontPageUrls,
      webFontUrl: webFontFixture.url,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

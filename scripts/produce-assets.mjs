#!/usr/bin/env node
/* global document, fetch, createImageBitmap, ImageData, FontFace -- used inside page.evaluate, which runs in the browser */
import { readFile, realpath, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { assetBrowser } from './asset-recipe-browser.mjs';

export async function produceAssets(profilePath, outputPath) {
  const path = await realpath(profilePath),
    root = dirname(path),
    info = await stat(path);
  if (info.size > 1048576)
    throw new RangeError('Production profile exceeds byte budget.');
  const profile = JSON.parse(await readFile(path, 'utf8'));
  if (
    !profile ||
    typeof profile !== 'object' ||
    Array.isArray(profile) ||
    !['atlas', 'bitmap', 'sdf', 'msdf'].includes(profile.type)
  )
    throw new Error('Profile type must be atlas, bitmap, sdf or msdf.');
  async function localURL(file) {
    if (typeof file !== 'string' || !file || file.length > 4096)
      throw new Error('Invalid input filename.');
    const canonical = await realpath(resolve(root, file)),
      rel = relative(root, canonical),
      input = await stat(canonical);
    if (
      rel.startsWith('..') ||
      isAbsolute(rel) ||
      !input.isFile() ||
      input.size > 33554432
    )
      throw new Error('Input escapes profile directory or byte budget.');
    return `/input/${rel.split(/[\\/]/u).map(encodeURIComponent).join('/')}`;
  }
  if (profile.type === 'atlas') {
    if (
      !Array.isArray(profile.images) ||
      !profile.images.length ||
      profile.images.length > 16384
    )
      throw new Error('Invalid atlas image count.');
    profile.images = await Promise.all(
      profile.images.map(async (image) => ({
        ...image,
        file: await localURL(image.file),
      })),
    );
  } else if (profile.type !== 'msdf')
    profile.font = await localURL(profile.font);
  const output = resolve(outputPath);
  // Exclusive creation rejects pre-existing directories and symlinks; never overwrite user output.
  await mkdir(output, { recursive: false });
  const browser = await assetBrowser({
    input: root,
    tools: dirname(fileURLToPath(import.meta.url)),
  });
  try {
    const result = await browser.page.evaluate(async (profile) => {
      const { packAtlas, signedDistanceField, multiChannelDistanceField } =
        await import('/tools/atlas-production-lib.mjs');
      const width = profile.width ?? 1024,
        height = profile.height ?? width;
      // Validate dimensions before native allocations.
      packAtlas([{ name: 'budget', width: 1, height: 1 }], {
        width,
        height,
        maxPages: profile.maxPages ?? 16,
        padding: profile.padding ?? 1,
        extrude: profile.extrude ?? 1,
      });
      const canvas = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
      };
      const rasters = [],
        glyphs = [];
      let base = 0,
        size = profile.size,
        lineHeight = 0,
        glyphPixels = 0,
        glyphWork = 0;
      const range = profile.range ?? 8;
      if (
        profile.type !== 'atlas' &&
        (!Number.isFinite(range) || range < 1 || range > 256)
      )
        throw new Error('Invalid distance range.');
      if (profile.type === 'atlas') {
        let totalPixels = 0;
        for (const entry of profile.images) {
          const response = await fetch(entry.file);
          if (!response.ok) throw new Error('Image acquisition failed.');
          const bitmap = await createImageBitmap(await response.blob(), {
            premultiplyAlpha: 'none',
            colorSpaceConversion: 'none',
          });
          if (
            bitmap.width > 4096 ||
            bitmap.height > 4096 ||
            (totalPixels += bitmap.width * bitmap.height) > 16777216
          ) {
            bitmap.close();
            throw new Error('Atlas decoded inputs exceed budget.');
          }
          const c = canvas(bitmap.width, bitmap.height),
            ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
          let left = c.width,
            top = c.height,
            right = -1,
            bottom = -1;
          if (profile.trim !== false) {
            for (let y = 0; y < c.height; y++)
              for (let x = 0; x < c.width; x++)
                if (pixels[(y * c.width + x) * 4 + 3]) {
                  left = Math.min(left, x);
                  top = Math.min(top, y);
                  right = Math.max(right, x);
                  bottom = Math.max(bottom, y);
                }
          } else {
            left = top = 0;
            right = c.width - 1;
            bottom = c.height - 1;
          }
          if (right < 0) {
            left = top = 0;
            right = bottom = 0;
          }
          rasters.push({
            name: entry.name,
            width: right - left + 1,
            height: bottom - top + 1,
            canvas: c,
            left,
            top,
            originalWidth: c.width,
            originalHeight: c.height,
          });
        }
      } else {
        if (!Number.isSafeInteger(size) || size < 1 || size > 512)
          throw new Error('Font size must be integer 1..512.');
        if (profile.type === 'msdf') {
          if (
            !Array.isArray(profile.glyphs) ||
            !profile.glyphs.length ||
            profile.glyphs.length > 4096 ||
            !Number.isSafeInteger(profile.base) ||
            !Number.isSafeInteger(profile.lineHeight) ||
            profile.base < 0 ||
            profile.base > 1000000 ||
            profile.lineHeight < 1 ||
            profile.lineHeight > 1000000
          )
            throw new Error('Invalid owned polygon font metrics.');
          base = profile.base;
          lineHeight = profile.lineHeight;
          for (const glyph of profile.glyphs) {
            if (
              ![glyph.id, glyph.xoffset, glyph.yoffset, glyph.xadvance].every(
                Number.isSafeInteger,
              ) ||
              [glyph.xoffset, glyph.yoffset, glyph.xadvance].some(
                (v) => Math.abs(v) > 1000000,
              ) ||
              glyph.id < 0 ||
              glyph.id > 0x10ffff ||
              (glyph.id >= 0xd800 && glyph.id <= 0xdfff)
            )
              throw new Error('Invalid polygon glyph metrics.');
            if ((glyphPixels += glyph.width * glyph.height) > 16777216)
              throw new Error(
                'Font glyph rasters exceed aggregate pixel budget.',
              );
            const edgeCount = Array.isArray(glyph.contours)
              ? glyph.contours.reduce(
                  (sum, contour) =>
                    sum + (Array.isArray(contour) ? contour.length : 0),
                  0,
                )
              : 0;
            if (
              (glyphWork += edgeCount * glyph.width * glyph.height) > 128000000
            )
              throw new Error(
                'Font outline distance work exceeds aggregate budget.',
              );
            const rgba = multiChannelDistanceField(
                glyph.contours,
                glyph.width,
                glyph.height,
                range,
              ),
              c = canvas(glyph.width, glyph.height);
            c.getContext('2d').putImageData(
              new ImageData(
                new Uint8ClampedArray(rgba),
                glyph.width,
                glyph.height,
              ),
              0,
              0,
            );
            rasters.push({
              name: String(glyph.id),
              width: glyph.width,
              height: glyph.height,
              canvas: c,
              left: 0,
              top: 0,
            });
            glyphs.push(glyph);
          }
        } else {
          if (
            typeof profile.alphabet !== 'string' ||
            profile.alphabet.length > 8192
          )
            throw new Error('Invalid alphabet budget.');
          const characters = Array.from(profile.alphabet);
          if (
            !characters.length ||
            characters.length > 4096 ||
            new Set(characters).size !== characters.length ||
            characters.some(
              (c) =>
                c === '\n' ||
                c === '\r' ||
                (c.codePointAt(0) >= 0xd800 && c.codePointAt(0) <= 0xdfff),
            )
          )
            throw new Error(
              'Alphabet must contain unique Unicode scalar glyphs.',
            );
          const font = new FontFace(
            'XYZProduction',
            `url(${JSON.stringify(profile.font)})`,
          );
          await font.load();
          document.fonts.add(font);
          const measure = canvas(1, 1).getContext('2d');
          measure.font = `${size}px XYZProduction`;
          const metrics = characters.map((c) => measure.measureText(c));
          base = Math.max(
            size,
            ...metrics.map((m) => Math.ceil(m.actualBoundingBoxAscent)),
          );
          lineHeight =
            base +
            Math.max(
              Math.ceil(size / 4),
              ...metrics.map((m) => Math.ceil(m.actualBoundingBoxDescent)),
            );
          const border = profile.type === 'sdf' ? Math.ceil(range / 2) + 1 : 0;
          for (let i = 0; i < characters.length; i++) {
            const m = metrics[i],
              left = Math.ceil(m.actualBoundingBoxLeft),
              ascent = Math.ceil(m.actualBoundingBoxAscent),
              w = Math.max(
                1,
                left + Math.ceil(m.actualBoundingBoxRight) + 2 * border,
              ),
              h = Math.max(
                1,
                ascent + Math.ceil(m.actualBoundingBoxDescent) + 2 * border,
              );
            if (w > 4096 || h > 4096 || (glyphPixels += w * h) > 16777216)
              throw new Error('Glyphs exceed raster budget.');
            const c = canvas(w, h),
              ctx = c.getContext('2d');
            ctx.font = measure.font;
            ctx.fillStyle = 'white';
            ctx.fillText(characters[i], left + border, ascent + border);
            if (profile.type === 'sdf') {
              const pixels = ctx.getImageData(0, 0, w, h).data,
                alpha = new Uint8Array(w * h);
              for (let p = 0; p < alpha.length; p++)
                alpha[p] = pixels[p * 4 + 3];
              const rgba = signedDistanceField(alpha, w, h, range);
              ctx.putImageData(
                new ImageData(new Uint8ClampedArray(rgba), w, h),
                0,
                0,
              );
            }
            const id = characters[i].codePointAt(0);
            glyphs.push({
              id,
              xoffset: -left - border,
              yoffset: base - ascent - border,
              xadvance: Math.round(m.width),
            });
            rasters.push({
              name: String(id),
              width: w,
              height: h,
              canvas: c,
              left: 0,
              top: 0,
            });
          }
          document.fonts.delete(font);
        }
      }
      const isAtlas = profile.type === 'atlas',
        extrude = isAtlas ? (profile.extrude ?? 1) : 0;
      const packed = packAtlas(rasters, {
        width,
        height,
        padding: profile.padding ?? 1,
        extrude,
        maxPages: profile.maxPages ?? 16,
      });
      if (packed.length * width * height > 67108864)
        throw new Error('Output atlas pages exceed aggregate pixel budget.');
      const files = [],
        textures = [],
        chars = [];
      for (let page = 0; page < packed.length; page++) {
        const c = canvas(width, height),
          ctx = c.getContext('2d'),
          frames = Object.create(null);
        for (const item of packed[page].items) {
          ctx.drawImage(
            item.canvas,
            item.left,
            item.top,
            item.width,
            item.height,
            item.x,
            item.y,
            item.width,
            item.height,
          );
          for (let dy = -extrude; dy < item.height + extrude; dy++)
            for (let dx = -extrude; dx < item.width + extrude; dx++)
              if (dx < 0 || dx >= item.width || dy < 0 || dy >= item.height)
                ctx.drawImage(
                  item.canvas,
                  item.left + Math.max(0, Math.min(item.width - 1, dx)),
                  item.top + Math.max(0, Math.min(item.height - 1, dy)),
                  1,
                  1,
                  item.x + dx,
                  item.y + dy,
                  1,
                  1,
                );
          if (isAtlas)
            frames[item.name] = {
              frame: { x: item.x, y: item.y, w: item.width, h: item.height },
              rotated: false,
              trimmed:
                item.left !== 0 ||
                item.top !== 0 ||
                item.width !== item.originalWidth ||
                item.height !== item.originalHeight,
              sourceSize: { w: item.originalWidth, h: item.originalHeight },
              spriteSourceSize: {
                x: item.left,
                y: item.top,
                w: item.width,
                h: item.height,
              },
            };
          else {
            const glyph = glyphs.find((g) => String(g.id) === item.name);
            chars.push({
              id: glyph.id,
              page,
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
              xoffset: glyph.xoffset,
              yoffset: glyph.yoffset,
              xadvance: glyph.xadvance,
              chnl: 15,
            });
          }
        }
        const filename = `page-${page}.png`;
        files.push({ filename, data: c.toDataURL('image/png').split(',')[1] });
        textures.push({
          frames,
          meta: {
            image: filename,
            format: 'RGBA8888',
            size: { w: width, h: height },
            scale: 1,
          },
        });
      }
      const descriptor = isAtlas
        ? { textures }
        : {
            info: { size },
            common: {
              lineHeight,
              base,
              scaleW: width,
              scaleH: height,
              pages: packed.length,
              packed: 0,
            },
            pages: files.map((f) => f.filename),
            chars: chars.sort((a, b) => a.id - b.id),
            kernings: [],
            ...(profile.type === 'bitmap'
              ? {}
              : {
                  distanceField: {
                    fieldType: profile.type,
                    distanceRange: range,
                  },
                }),
          };
      return {
        files,
        descriptor,
        descriptorName: isAtlas ? 'atlas.json' : 'font.json',
      };
    }, profile);
    for (const file of result.files)
      await writeFile(
        resolve(output, file.filename),
        Buffer.from(file.data, 'base64'),
        { flag: 'wx' },
      );
    await writeFile(
      resolve(output, result.descriptorName),
      JSON.stringify(result.descriptor, null, 2) + '\n',
      { flag: 'wx' },
    );
    return {
      output,
      pages: result.files.length,
      descriptor: result.descriptorName,
    };
  } finally {
    await browser.close();
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log(
      'Usage: node scripts/produce-assets.mjs <profile.json> <NEW-output-directory>',
    );
  } else if (process.argv.length !== 4) {
    console.error(
      'Usage: node scripts/produce-assets.mjs <profile.json> <NEW-output-directory>',
    );
    process.exitCode = 1;
  } else
    produceAssets(process.argv[2], process.argv[3])
      .then((result) => console.log(JSON.stringify(result)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
}

import {
  AnimatedImageTexture,
  type AnimatedImageAtlas,
} from '../../packages/assets/src/animated-image.js';
import { Scene, Sprite, SpriteSheet, type Renderer } from '../../src/index.js';
import { animatedAPNG, animatedGIF } from '../animated-image-fixtures.js';
import { frameProofs } from './frame-proof.js';

/** Real Chromium ImageDecoder, generated local GIF/APNG bytes and renderer upload/readback. */
export async function runAnimatedImageSmoke(
  renderer: Renderer,
  canvas: HTMLCanvasElement,
) {
  const proofs = frameProofs(renderer, canvas);
  const results: Array<{
    type: string;
    frames: number;
    plays: number;
    changedPixels: number;
  }> = [];
  for (const [type, data] of [
    ['image/gif', animatedGIF()],
    ['image/png', animatedAPNG()],
  ] as const) {
    const texture = await AnimatedImageTexture.decode(data, type);
    const scene = new Scene();
    let atlas: AnimatedImageAtlas | undefined;
    const pixels = () =>
      (texture.image.getContext('2d') as CanvasRenderingContext2D).getImageData(
        0,
        0,
        2,
        1,
      ).data;
    const expected = (values: number[]) => {
      const actual = pixels();
      if (actual.some((value, index) => value !== values[index]))
        throw new Error(
          `${type} composited/disposal pixels differ: ${Array.from(actual)}`,
        );
    };
    const draw = async () => {
      renderer.beginFrame();
      renderer.render(scene, canvas.width, canvas.height);
      const proof = proofs.next();
      renderer.endFrame();
      return (await proof).bytes;
    };
    try {
      if (
        texture.plays !== 2 ||
        texture.durations.length !== 3 ||
        texture.durations.some(
          (duration, index) =>
            Math.abs(duration - [0.1, 0.2, 0.3][index]!) > 0.000001,
        )
      )
        throw new Error(`${type} timing/repetition metadata differs.`);
      expected([255, 0, 0, 255, 255, 0, 0, 255]);
      scene.add(
        new Sprite({
          texture,
          anchor: [0, 0],
          position: [8, 8],
          scale: [32, 32],
        }),
      );
      const first = await draw();
      texture.updateAnimation(0.100001);
      expected([0, 255, 0, 255, 255, 0, 0, 255]);
      texture.updateAnimation(0.2);
      expected([255, 0, 0, 255, 0, 0, 255, 255]);
      const third = await draw();
      let changedPixels = 0;
      for (let i = 0; i < first.length; i += 4)
        if (
          Math.abs(first[i]! - third[i]!) +
            Math.abs(first[i + 2]! - third[i + 2]!) >
          100
        )
          changedPixels++;
      if (changedPixels < 128)
        throw new Error(
          `${type} Sprite did not upload changed decoder pixels.`,
        );
      texture.pause();
      const version = texture.version;
      texture.updateAnimation(100);
      if (texture.version !== version)
        throw new Error(`${type} paused texture advanced.`);
      atlas = texture.createAtlas();
      const sheet = new SpriteSheet(atlas.texture, atlas.frames);
      const region = sheet.getFrame(2);
      const atlasPixels = (
        atlas.texture.image.getContext('2d') as CanvasRenderingContext2D
      ).getImageData(region.x, region.y, 2, 1).data;
      if (atlasPixels[0] !== 255 || atlasPixels[6] !== 255)
        throw new Error(
          `${type} SpriteSheet atlas lost disposed frame composition.`,
        );
      texture.play();
      texture.updateAnimation(2);
      if (!texture.ended || texture.frame !== 2)
        throw new Error(
          `${type} finite repetition did not freeze at final frame.`,
        );
      texture.destroy();
      if (atlas.texture.destroyed || texture.image.width !== 0)
        throw new Error(`${type} texture/atlas ownership differs.`);
      results.push({
        type,
        frames: texture.durations.length,
        plays: texture.plays,
        changedPixels,
      });
    } finally {
      scene.destroy();
      texture.destroy();
      atlas?.destroy();
    }
  }
  return {
    backend: renderer.backend,
    results,
    imageDecoder: true,
    restorePrevious: true,
    ownership: true,
  };
}

import {
  Geometry,
  Mesh,
  PBRMaterial,
  Scene,
  Sprite,
  Texture,
  Vector3,
  VideoTexture,
  type Renderer,
} from '../../src/index.js';
import { frameProofs } from './frame-proof.js';

/** Run on a live native renderer. Generates local media; no network assets or demux assumptions. */
export async function runVideoTextureSmoke(
  renderer: Renderer,
  canvas: HTMLCanvasElement,
) {
  if (!renderer.capabilities.threeD)
    throw new Error('Video PBR smoke requires a native 3D backend.');
  const source = document.createElement('canvas');
  source.width = source.height = 32;
  const context = source.getContext('2d')!;
  const paint = (color: string) => {
    context.fillStyle = color;
    context.fillRect(0, 0, 32, 32);
  };
  paint('#ff0000');
  const stream = source.captureStream(30);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  let texture: VideoTexture | undefined;
  let fallback: Texture | undefined;
  const scene2D = new Scene(),
    scene3D = new Scene();
  const geometry = Geometry.cube();
  const proofs = frameProofs(renderer, canvas);
  const draw = async (scene: Scene) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    renderer.beginFrame();
    renderer.render(scene, canvas.width, canvas.height);
    const proof = proofs.next();
    renderer.endFrame();
    return (await proof).bytes;
  };
  const advance = async (color: string) => {
    const version = texture!.version;
    const deadline = performance.now() + 3000;
    paint(color);
    const expected = context.getImageData(0, 0, 1, 1).data;
    let copied = false;
    while (!copied && performance.now() < deadline) {
      (
        stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack
      ).requestFrame();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const actual = (
        texture!.image.getContext('2d') as CanvasRenderingContext2D
      ).getImageData(0, 0, 1, 1).data;
      copied =
        texture!.version > version &&
        Math.abs(actual[0]! - expected[0]!) < 20 &&
        Math.abs(actual[2]! - expected[2]!) < 20;
    }
    if (!copied)
      throw new Error('Playing native video did not advance source pixels.');
  };
  const changed = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
    let pixels = 0;
    for (let i = 0; i < a.length; i += 4)
      if (Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 2]! - b[i + 2]!) > 40)
        pixels++;
    if (pixels < 64)
      throw new Error('Native consumer did not upload changed video pixels.');
    return pixels;
  };
  try {
    await video.play();
    texture = await VideoTexture.fromVideo(video, { ownVideo: true });
    const sprite = new Sprite({
      texture,
      anchor: [0, 0],
      position: [8, 8],
      scale: [3, 3],
    });
    scene2D.add(sprite);
    fallback = await Texture.fromImage(
      Object.assign(document.createElement('canvas'), {
        width: 1,
        height: 1,
      }),
    );
    const mesh = new Mesh({
      geometry,
      material: new PBRMaterial({
        texture: fallback,
        textureSource: texture,
        metallic: 0,
        roughness: 1,
      }),
    });
    scene3D.add(mesh);
    scene3D.camera3D.position.set(0, 0, 4);
    scene3D.camera3D.lookAt(new Vector3(0, 0, 0));
    scene3D.ambientLight = 1;
    scene3D.directionalLight.intensity = 0;
    const red2D = await draw(scene2D),
      red3D = await draw(scene3D);
    await advance('#0000ff');
    const blue2D = await draw(scene2D),
      blue3D = await draw(scene3D);
    const spritePixels = changed(red2D, blue2D),
      meshPixels = changed(red3D, blue3D);
    texture.pause();
    const paused = texture.version;
    paint('#00ff00');
    (
      stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack
    ).requestFrame();
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    if (texture.version !== paused) throw new Error('Paused texture advanced.');
    const pausedProof = await draw(scene3D);
    if (pausedProof.some((value, i) => value !== blue3D[i]))
      throw new Error('Paused mesh pixels changed.');
    const frame = new VideoFrame(source, { timestamp: 0 });
    texture.ingest(frame);
    if (frame.codedWidth !== 0)
      throw new Error('Ingest did not close the transferred VideoFrame.');
    changed(blue3D, await draw(scene3D));
    // Exercise an actual elementary stream decoder, not a pretend MP4 loader.
    const config: VideoEncoderConfig = {
      codec: 'vp8',
      width: 32,
      height: 32,
      bitrate: 100000,
      framerate: 30,
    };
    if (
      typeof VideoEncoder === 'undefined' ||
      !(await VideoEncoder.isConfigSupported(config)).supported
    )
      throw new Error(
        'Real decoder smoke requires supported WebCodecs VP8 encoder.',
      );
    const chunks: EncodedVideoChunk[] = [];
    let decoderConfig: VideoDecoderConfig | undefined;
    const green3D = await draw(scene3D);
    let encoderError: Error | undefined;
    const encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        chunks.push(chunk);
        decoderConfig = metadata?.decoderConfig ?? decoderConfig;
      },
      error: (error) => {
        encoderError = error;
      },
    });
    try {
      encoder.configure(config);
      paint('#ff0000');
      const encodedFrame = new VideoFrame(source, { timestamp: 0 });
      try {
        encoder.encode(encodedFrame, { keyFrame: true });
      } finally {
        encodedFrame.close();
      }
      await encoder.flush();
      if (encoderError) throw encoderError;
    } finally {
      encoder.close();
    }
    const adapter = await texture.createDecoder(
      decoderConfig ?? { codec: 'vp8', codedWidth: 32, codedHeight: 32 },
    );
    for (const chunk of chunks) adapter.decode(chunk);
    await adapter.flush();
    if (texture.lastError) throw texture.lastError;
    changed(await draw(scene3D), green3D);
    const finalVersion = texture.version;
    texture.destroy();
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    if (texture.version !== finalVersion)
      throw new Error('Destroyed video resurrected.');
    return {
      backend: renderer.backend,
      spritePixels,
      meshPixels,
      paused: true,
      externalFrameClosed: true,
      decodedChunks: chunks.length,
      destroyed: true,
    };
  } finally {
    texture?.destroy();
    for (const track of stream.getTracks()) track.stop();
    video.pause();
    video.srcObject = null;
    scene2D.destroy();
    scene3D.destroy();
    fallback?.destroy();
  }
}

import {
  NativeTexture2D,
  nativeTextureFormats,
  nativeTextureLayout,
} from '../../assets/src/native-texture.js';
import type { NativeTextureFormat } from '../../assets/src/native-texture.js';
import { GraphicsError } from './errors.js';

export const compressionFeatures: readonly GPUFeatureName[] = [
  'texture-compression-bc',
  'texture-compression-etc2',
  'texture-compression-astc',
];

export function webgpuTextureFormats(
  device: GPUDevice,
): readonly NativeTextureFormat[] {
  return Object.freeze(
    (Object.keys(nativeTextureFormats) as NativeTextureFormat[]).filter(
      (format) => {
        const feature = nativeTextureFormats[format][5];
        return !feature || device.features.has(feature);
      },
    ),
  );
}

export function validateNativeWebGPU(
  device: GPUDevice,
  source: NativeTexture2D,
): void {
  const [bw, bh, , , , feature] = nativeTextureFormats[source.format];
  if (feature && !device.features.has(feature))
    throw new GraphicsError(
      `WebGPU does not support native texture format ${source.format}.`,
    );
  if (feature && (source.width % bw !== 0 || source.height % bh !== 0))
    throw new GraphicsError(
      `WebGPU compressed base dimensions must be multiples of ${bw}×${bh} for ${source.format}.`,
    );
}

export function uploadNativeWebGPU(
  device: GPUDevice,
  resource: GPUTexture,
  source: NativeTexture2D,
): void {
  const [bw, bh] = nativeTextureFormats[source.format];
  for (let mipLevel = 0; mipLevel < source.levels.length; mipLevel++) {
    const mip = source.levels[mipLevel]!;
    const layout = nativeTextureLayout(source.format, mip.width, mip.height);
    device.queue.writeTexture(
      { texture: resource, mipLevel },
      mip.data as GPUAllowSharedBufferSource,
      { bytesPerRow: layout.bytesPerRow, rowsPerImage: layout.rows },
      [Math.ceil(mip.width / bw) * bw, Math.ceil(mip.height / bh) * bh],
    );
  }
}

/** Encoded sRGB payloads follow the same shader conversion as decoded images. */
export function nativeUploadFormat(
  format: NativeTextureFormat,
): NativeTextureFormat {
  return format.replace(/-srgb$/, '') as NativeTextureFormat;
}

export function webglTextureFormats(
  gl: WebGL2RenderingContext,
): readonly NativeTextureFormat[] {
  const s3tc = gl.getExtension('WEBGL_compressed_texture_s3tc');
  const s3tcSRGB = gl.getExtension('WEBGL_compressed_texture_s3tc_srgb');
  const rgtc = gl.getExtension('EXT_texture_compression_rgtc');
  const bptc = gl.getExtension('EXT_texture_compression_bptc');
  const etc = gl.getExtension('WEBGL_compressed_texture_etc');
  const astc = gl.getExtension('WEBGL_compressed_texture_astc');
  const enums = new Set<number>(
    gl.getParameter(gl.COMPRESSED_TEXTURE_FORMATS) as Uint32Array,
  );
  return Object.freeze(
    (Object.keys(nativeTextureFormats) as NativeTextureFormat[]).filter(
      (format) => {
        const [, , , , internal, feature] = nativeTextureFormats[format];
        if (!feature) return true;
        const extension =
          format.startsWith('bc1-') ||
          format.startsWith('bc2-') ||
          format.startsWith('bc3-')
            ? format.endsWith('-srgb')
              ? s3tcSRGB && s3tc
              : s3tc
            : format.startsWith('bc4-') || format.startsWith('bc5-')
              ? rgtc
              : format.startsWith('bc6h-') || format.startsWith('bc7-')
                ? bptc
                : feature === 'texture-compression-etc2'
                  ? etc
                  : astc;
        return !!extension && enums.has(internal);
      },
    ),
  );
}

export function uploadNativeWebGL(
  gl: WebGL2RenderingContext,
  source: NativeTexture2D,
): void {
  const format = nativeUploadFormat(source.format);
  const [, , , , internal, feature] = nativeTextureFormats[format];
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  try {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAX_LEVEL,
      source.levels.length - 1,
    );
    for (let level = 0; level < source.levels.length; level++) {
      const mip = source.levels[level]!;
      if (feature)
        gl.compressedTexImage2D(
          gl.TEXTURE_2D,
          level,
          internal,
          mip.width,
          mip.height,
          0,
          mip.data,
        );
      else
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internal,
          mip.width,
          mip.height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          mip.data,
        );
    }
  } finally {
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  }
}

import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { pathToFileURL } from 'node:url';
import { assetRecipe } from '../src/data/asset-recipe.ts';
import { modelLimits } from '../src/data/models.ts';
import { decodeDracoAttribute } from './asset-recipe-browser-codecs.mjs';
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const types = {
  5120: ['readInt8', 1, 127, -128, 'writeInt8'],
  5121: ['readUInt8', 1, 255, 0, 'writeUInt8'],
  5122: ['readInt16LE', 2, 32767, -32768, 'writeInt16LE'],
  5123: ['readUInt16LE', 2, 65535, 0, 'writeUInt16LE'],
  5125: ['readUInt32LE', 4, 4294967295, 0, 'writeUInt32LE'],
  5126: ['readFloatLE', 4, 1, -1, 'writeFloatLE'],
};
function viewBytes(asset, index) {
  const view = asset.document.bufferViews?.[index],
    source = asset.buffers[view?.buffer];
  if (
    !view ||
    !source ||
    !Number.isSafeInteger(view.byteLength) ||
    !Number.isSafeInteger(view.byteOffset ?? 0) ||
    (view.byteOffset ?? 0) < 0 ||
    view.byteLength < 0 ||
    (view.byteOffset ?? 0) + view.byteLength > source.length
  )
    throw new Error('Draco bufferView is out of bounds.');
  return source.subarray(
    view.byteOffset ?? 0,
    (view.byteOffset ?? 0) + view.byteLength,
  );
}
function accessorValues(asset, index) {
  const a = asset.document.accessors?.[index],
    n = components[a?.type],
    type = types[a?.componentType];
  if (
    !a ||
    !n ||
    !type ||
    !Number.isSafeInteger(a.count) ||
    a.count < 1 ||
    a.count > modelLimits.vertices * 3
  )
    throw new Error('Invalid Draco source accessor.');
  const values = new Float64Array(a.count * n);
  const copy = (source, offset, stride, count, destination, normalize) => {
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(stride) ||
      stride < n * type[1] ||
      offset + (count - 1) * stride + n * type[1] > source.length
    )
      throw new Error('Draco accessor range is invalid.');
    for (let i = 0; i < count; i++)
      for (let c = 0; c < n; c++) {
        let v = source[type[0]](offset + i * stride + c * type[1]);
        if (normalize) v = Math.max(-1, v / type[2]);
        if (!Number.isFinite(v))
          throw new Error('Draco accessor has nonfinite values.');
        values[destination(i) * n + c] = v;
      }
  };
  if (a.bufferView !== undefined)
    copy(
      viewBytes(asset, a.bufferView),
      a.byteOffset ?? 0,
      asset.document.bufferViews[a.bufferView].byteStride ?? n * type[1],
      a.count,
      (i) => i,
      a.normalized,
    );
  if (a.sparse) {
    const s = a.sparse,
      it = types[s.indices?.componentType];
    if (
      !it ||
      ![5121, 5123, 5125].includes(s.indices.componentType) ||
      !Number.isSafeInteger(s.count) ||
      s.count < 1 ||
      s.count > a.count
    )
      throw new Error('Invalid sparse Draco accessor.');
    const bytes = viewBytes(asset, s.indices.bufferView),
      offset = s.indices.byteOffset ?? 0;
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset + s.count * it[1] > bytes.length
    )
      throw new Error('Sparse Draco index range is invalid.');
    const indices = [];
    let previous = -1;
    for (let i = 0; i < s.count; i++) {
      const v = bytes[it[0]](offset + i * it[1]);
      if (v <= previous || v >= a.count)
        throw new Error('Sparse Draco indices are invalid.');
      previous = v;
      indices.push(v);
    }
    copy(
      viewBytes(asset, s.values.bufferView),
      s.values.byteOffset ?? 0,
      n * type[1],
      s.count,
      (i) => indices[i],
      a.normalized,
    );
  }
  return { values, count: a.count, size: n };
}
function append(asset, bytes) {
  const d = asset.document;
  if (
    asset.buffers.reduce((sum, b) => sum + b.length, 0) + bytes.length >
    modelLimits.decodedBytes
  )
    throw new Error('Draco conversion exceeds model byte budget.');
  d.buffers ??= [];
  d.bufferViews ??= [];
  const buffer = asset.buffers.push(bytes) - 1;
  d.buffers.push({ byteLength: bytes.length });
  return d.bufferViews.push({ buffer, byteLength: bytes.length }) - 1;
}
function writeAccessor(asset, index, values, count, indices = false) {
  const a = asset.document.accessors[index];
  const componentType = indices ? 5125 : a.componentType,
    type = types[componentType];
  if (!type) throw new Error('Invalid decoded Draco accessor type.');
  const bytes = Buffer.alloc(values.length * type[1]);
  const minimum =
    a.type === 'VEC3' ? [Infinity, Infinity, Infinity] : undefined;
  const maximum = minimum ? [-Infinity, -Infinity, -Infinity] : undefined;
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    if (!Number.isFinite(value))
      throw new Error('Invalid decoded Draco value.');
    if (a.normalized && !indices) value = Math.round(value * type[2]);
    if (
      (componentType !== 5126 &&
        (!Number.isSafeInteger(value) || value < type[3] || value > type[2])) ||
      (indices && value >= modelLimits.vertices) ||
      (componentType === 5126 && Math.abs(value) > 3.4028234663852886e38)
    )
      throw new Error('Decoded Draco value is outside the accessor range.');
    bytes[type[4]](value, i * type[1]);
    if (minimum) {
      const c = i % 3;
      minimum[c] = Math.min(minimum[c], value);
      maximum[c] = Math.max(maximum[c], value);
    }
  }
  a.bufferView = append(asset, bytes);
  a.byteOffset = 0;
  a.componentType = componentType;
  a.count = count;
  if (indices) delete a.normalized;
  delete a.sparse;
  if (minimum) {
    a.min = minimum;
    a.max = maximum;
  } else {
    delete a.min;
    delete a.max;
  }
}
export async function createDracoAdapter(pin, base, verify) {
  if (pin.version !== assetRecipe.dracoVersion)
    throw new Error('Draco version pin must be 1.5.7.');
  const paths = {};
  for (const name of ['decoder', 'decoderWasm', 'encoder', 'encoderWasm'])
    paths[name] = await verify(pin[name], base);
  const factory = async (name) => {
    const exported = await import(pathToFileURL(paths[name]).href);
    return exported.default({
      wasmBinary: await readFile(paths[`${name}Wasm`]),
    });
  };
  const decoderModule = await factory('decoder'),
    encoderModule = await factory('encoder');
  const evidence = {
    version: pin.version,
    files: Object.fromEntries(
      Object.keys(paths).map((key) => [key, pin[key].sha256]),
    ),
  };
  return {
    evidence,
    paths,
    decode(asset) {
      const m = decoderModule;
      for (const mesh of asset.document.meshes ?? [])
        for (const p of mesh.primitives ?? []) {
          const ext = p.extensions?.KHR_draco_mesh_compression;
          if (!ext) continue;
          const bytes = viewBytes(asset, ext.bufferView),
            decoder = new m.Decoder(),
            buffer = new m.DecoderBuffer(),
            decoded = new m.Mesh(),
            face = new m.DracoInt32Array();
          const owned = [decoder, buffer, decoded, face];
          try {
            buffer.Init(
              new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length),
              bytes.length,
            );
            if (decoder.GetEncodedGeometryType(buffer) !== m.TRIANGULAR_MESH)
              throw new Error('Draco input is not a triangular mesh.');
            const status = decoder.DecodeBufferToMesh(buffer, decoded);
            owned.push(status);
            if (!status.ok())
              throw new Error(
                `Official Draco decode failed: ${status.error_msg()}`,
              );
            const count = decoded.num_points(),
              faces = decoded.num_faces();
            if (
              !count ||
              count > modelLimits.vertices ||
              !faces ||
              faces * 3 > modelLimits.indices
            )
              throw new Error('Decoded Draco geometry exceeds budgets.');
            if (
              !ext.attributes ||
              typeof ext.attributes !== 'object' ||
              Array.isArray(ext.attributes) ||
              ext.attributes.POSITION === undefined
            )
              throw new Error('Invalid Draco attribute mapping.');
            for (const [semantic, unique] of Object.entries(ext.attributes)) {
              const index = p.attributes?.[semantic];
              if (
                !Number.isSafeInteger(unique) ||
                unique < 0 ||
                !Number.isSafeInteger(index) ||
                index < 0
              )
                throw new Error('Invalid Draco attribute reference.');
              const attribute = decoder.GetAttributeByUniqueId(decoded, unique),
                a = asset.document.accessors?.[index],
                n = components[a?.type];
              if (
                !attribute?.ptr ||
                !n ||
                attribute.num_components() !== n ||
                a.count !== count
              )
                throw new Error('Draco attribute does not match accessor.');
              const values = decodeDracoAttribute(
                m,
                decoder,
                decoded,
                attribute,
                a,
                owned,
              );
              writeAccessor(asset, index, values, count);
            }
            const indices = new Uint32Array(faces * 3);
            for (let i = 0; i < faces; i++) {
              if (!decoder.GetFaceFromMesh(decoded, i, face))
                throw new Error('Draco face decode failed.');
              for (let c = 0; c < 3; c++) {
                const v = face.GetValue(c);
                if (v < 0 || v >= count)
                  throw new Error('Decoded Draco face is out of bounds.');
                indices[i * 3 + c] = v;
              }
            }
            if (p.indices === undefined) {
              asset.document.accessors ??= [];
              p.indices =
                asset.document.accessors.push({
                  type: 'SCALAR',
                  count: indices.length,
                }) - 1;
            }
            writeAccessor(asset, p.indices, indices, indices.length, true);
            delete p.extensions.KHR_draco_mesh_compression;
          } finally {
            for (const object of owned.reverse()) m.destroy(object);
          }
        }
      asset.document.extensionsRequired = (
        asset.document.extensionsRequired ?? []
      ).filter((n) => n !== 'KHR_draco_mesh_compression');
    },
    encode(asset, settings = {}) {
      const speed = settings?.speed ?? 5;
      if (!Number.isInteger(speed) || speed < 0 || speed > 10)
        throw new Error('Invalid Draco encoding speed.');
      const m = encoderModule;
      for (const mesh of asset.document.meshes ?? [])
        for (const p of mesh.primitives ?? []) {
          const encoder = new m.Encoder(),
            builder = new m.MeshBuilder(),
            encodedMesh = new m.Mesh(),
            result = new m.DracoInt8Array();
          try {
            const position = accessorValues(asset, p.attributes.POSITION),
              count = position.count;
            const sourceIndices =
              p.indices === undefined
                ? Array.from({ length: count }, (_, i) => i)
                : accessorValues(asset, p.indices).values;
            if (
              !sourceIndices.length ||
              sourceIndices.length % 3 ||
              Array.from(sourceIndices).some(
                (v) => !Number.isSafeInteger(v) || v < 0 || v >= count,
              )
            )
              throw new Error('Invalid Draco source triangle indices.');
            const faces = Uint32Array.from(sourceIndices);
            if (!builder.AddFacesToMesh(encodedMesh, faces.length / 3, faces))
              throw new Error('Official Draco mesh builder rejected faces.');
            const attributes = {};
            for (const [semantic, index] of Object.entries(p.attributes)) {
              const data = accessorValues(asset, index);
              if (data.count !== count)
                throw new Error('Draco attribute count mismatch.');
              const kind =
                semantic === 'POSITION'
                  ? m.POSITION
                  : semantic === 'NORMAL'
                    ? m.NORMAL
                    : semantic.startsWith('TEXCOORD_')
                      ? m.TEX_COORD
                      : semantic.startsWith('COLOR_')
                        ? m.COLOR
                        : m.GENERIC;
              // Preserve JOINTS and integer generic values without Float32 rounding.
              const a = asset.document.accessors[index];
              attributes[semantic] =
                a.componentType === 5125 && !a.normalized
                  ? builder.AddUInt32Attribute(
                      encodedMesh,
                      kind,
                      count,
                      data.size,
                      Uint32Array.from(data.values),
                    )
                  : a.componentType !== 5126 && !a.normalized
                    ? builder.AddInt32AttributeToMesh(
                        encodedMesh,
                        kind,
                        count,
                        data.size,
                        Int32Array.from(data.values),
                      )
                    : builder.AddFloatAttributeToMesh(
                        encodedMesh,
                        kind,
                        count,
                        data.size,
                        Float32Array.from(data.values),
                      );
              if (attributes[semantic] < 0)
                throw new Error(
                  'Official Draco mesh builder rejected attribute.',
                );
            }
            // Sequential encoding preserves vertex order for uncompressed morph target streams.
            encoder.SetSpeedOptions(speed, speed);
            encoder.SetEncodingMethod(m.MESH_SEQUENTIAL_ENCODING);
            // No attribute quantization is enabled.
            const size = encoder.EncodeMeshToDracoBuffer(encodedMesh, result);
            if (size < 1 || size > modelLimits.fetchedBytes)
              throw new Error(
                'Official Draco encoding failed/exceeded budget.',
              );
            const bytes = Buffer.alloc(size);
            for (let i = 0; i < size; i++) bytes[i] = result.GetValue(i);
            p.extensions ??= {};
            p.extensions.KHR_draco_mesh_compression = {
              bufferView: append(asset, bytes),
              attributes,
            };
          } finally {
            m.destroy(result);
            m.destroy(encodedMesh);
            m.destroy(builder);
            m.destroy(encoder);
          }
        }
      asset.document.extensionsUsed = [
        ...new Set([
          ...(asset.document.extensionsUsed ?? []),
          'KHR_draco_mesh_compression',
        ]),
      ];
      asset.document.extensionsRequired = [
        ...new Set([
          ...(asset.document.extensionsRequired ?? []),
          'KHR_draco_mesh_compression',
        ]),
      ];
    },
  };
}

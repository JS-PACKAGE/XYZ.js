/* global document, window, fetch */
const accessorTypes = {
  5120: [-128, 127],
  5121: [0, 255],
  5122: [-32768, 32767],
  5123: [0, 65535],
  5125: [0, 4294967295],
  5126: null,
};

/** Decode in the declared accessor's logical space without routing integers through Float32. */
export function decodeDracoAttribute(
  m,
  decoder,
  mesh,
  attribute,
  accessor,
  owned,
) {
  if (
    !accessor ||
    !Object.hasOwn(accessorTypes, accessor.componentType) ||
    (accessor.normalized && [5125, 5126].includes(accessor.componentType))
  )
    throw new Error('Invalid Draco accessor component type.');
  const sourceTypes = {
    [m.DT_INT8]: ['Int8', Int8Array, -128, 127],
    [m.DT_UINT8]: ['UInt8', Uint8Array, 0, 255],
    [m.DT_INT16]: ['Int16', Int16Array, -32768, 32767],
    [m.DT_UINT16]: ['UInt16', Uint16Array, 0, 65535],
    [m.DT_INT32]: ['Int32', Int32Array, -2147483648, 2147483647],
    [m.DT_UINT32]: ['UInt32', Uint32Array, 0, 4294967295],
    [m.DT_FLOAT32]: ['Float', Float32Array],
  };
  const source = sourceTypes[attribute.data_type()];
  if (!source) throw new Error('Unsupported Draco attribute data type.');
  const data = new m[
    `Draco${source[0] === 'Float' ? 'Float32' : source[0]}Array`
  ]();
  owned.push(data);
  if (
    !decoder[`GetAttribute${source[0]}ForAllPoints`](mesh, attribute, data) ||
    data.size() !== mesh.num_points() * attribute.num_components()
  )
    throw new Error('Draco attribute decode failed.');
  const range = accessorTypes[accessor.componentType];
  // Our encoder stores normalized accessors as logical floats. External encoders may instead
  // store raw integers, with or without Draco's normalized flag.
  const normalize =
    source[0] !== 'Float' &&
    (accessor.normalized || (!range && attribute.normalized()));
  const divisor = normalize
    ? attribute.normalized()
      ? source[3]
      : range[1]
    : 1;
  const values = normalize
    ? new Float64Array(data.size())
    : new source[1](data.size());
  for (let i = 0; i < values.length; i++) {
    const raw = data.GetValue(i);
    const value = normalize
      ? Math.max(source[2] < 0 ? -1 : 0, raw / divisor)
      : raw;
    if (
      normalize &&
      accessor.normalized &&
      !attribute.normalized() &&
      (raw < range[0] || raw > range[1])
    )
      throw new Error('Decoded Draco value is outside the accessor range.');
    if (
      !Number.isFinite(value) ||
      (range &&
        !accessor.normalized &&
        (!Number.isSafeInteger(value) ||
          value < range[0] ||
          value > range[1])) ||
      (range &&
        accessor.normalized &&
        (value < (range[0] < 0 ? -1 : 0) || value > 1)) ||
      (!range && Math.abs(value) > 3.4028234663852886e38)
    )
      throw new Error('Decoded Draco value is outside the accessor range.');
    values[i] = value;
  }
  return values;
}

/** Development preflight/smoke only; callers supply an already checksum-verified official module. */
export async function createDracoBrowserDecoder(scriptURL, wasmURL) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptURL;
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error('Official Draco script failed to load.'));
    document.head.append(script);
  });
  const response = await fetch(wasmURL);
  if (!response.ok) throw new Error('Official Draco WASM failed to load.');
  const module = await window.DracoDecoderModule({
    wasmBinary: new Uint8Array(await response.arrayBuffer()),
  });
  return (request) => {
    const m = module,
      decoder = new m.Decoder(),
      buffer = new m.DecoderBuffer(),
      mesh = new m.Mesh(),
      face = new m.DracoInt32Array();
    const owned = [decoder, buffer, mesh, face];
    try {
      buffer.Init(
        new Int8Array(
          request.data.buffer,
          request.data.byteOffset,
          request.data.byteLength,
        ),
        request.data.byteLength,
      );
      if (decoder.GetEncodedGeometryType(buffer) !== m.TRIANGULAR_MESH)
        throw new Error('Draco payload is not a mesh.');
      const status = decoder.DecodeBufferToMesh(buffer, mesh);
      owned.push(status);
      if (!status.ok()) throw new Error(status.error_msg());
      const count = mesh.num_points(),
        faces = mesh.num_faces();
      if (count < 1 || count > 1000000 || faces < 1 || faces > 1000000)
        throw new Error('Draco geometry exceeds budget.');
      const attributes = {};
      for (const [semantic, id] of Object.entries(request.attributes)) {
        const attribute = decoder.GetAttributeByUniqueId(mesh, id);
        if (
          !attribute?.ptr ||
          attribute.num_components() < 1 ||
          attribute.num_components() > 4
        )
          throw new Error('Missing Draco attribute.');
        const values = decodeDracoAttribute(
          m,
          decoder,
          mesh,
          attribute,
          request.accessors[semantic],
          owned,
        );
        attributes[semantic] = values;
      }
      const indices = new Uint32Array(faces * 3);
      for (let i = 0; i < faces; i++) {
        if (!decoder.GetFaceFromMesh(mesh, i, face))
          throw new Error('Draco face decode failed.');
        for (let c = 0; c < 3; c++) {
          const value = face.GetValue(c);
          if (value < 0 || value >= count)
            throw new Error('Draco index out of range.');
          indices[i * 3 + c] = value;
        }
      }
      return { attributes, indices };
    } finally {
      for (const object of owned.reverse()) m.destroy(object);
    }
  };
}

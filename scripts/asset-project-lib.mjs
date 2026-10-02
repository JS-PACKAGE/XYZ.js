import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDecoder } from 'node:util';
import {
  assetRecipe,
  rendering2dLimits,
  engineDirectory,
} from './asset-tool-paths.mjs';
import {
  checksum,
  parseModel,
  recipeSupportsExtension,
} from './asset-recipe-lib.mjs';

export class ProjectError extends Error {
  constructor(file, location, message, options) {
    super(`${file}:${location}: ${message}`, options);
    this.name = 'ProjectError';
    this.file = file;
    this.location = location;
  }
}
const types = new Set([
  'model',
  'map',
  'tileset',
  'atlas',
  'bitmapFont',
  'font',
  'texture',
  'json',
  'text',
  'binary',
]);
const pointer = (key) =>
  String(key).replaceAll('~', '~0').replaceAll('/', '~1');
export function jsonLocation(path) {
  if (!path || path === '/' || path.startsWith('/')) return path || '/';
  return (
    '/' +
    path
      .replace(/^(map|tileset)\.?/, '')
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean)
      .map(pointer)
      .join('/')
  );
}
const contained = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel);
};
const hasControlCharacters = (value) => {
  for (let index = 0; index < value.length; index++)
    if (value.charCodeAt(index) < 32) return true;
  return false;
};

/** Resolve every dependency before opening a browser or allocating output. No remote acquisition. */
export async function scanProject(manifestPath, { signal } = {}) {
  signal?.throwIfAborted();
  const requested = resolve(manifestPath);
  try {
    manifestPath = await realpath(requested);
  } catch (error) {
    throw new ProjectError(
      requested,
      '/',
      'Missing or inaccessible project manifest.',
      { cause: error },
    );
  }
  const root = dirname(manifestPath);
  const files = new Map(),
    visited = new Set();
  let bytes = 0;
  const fail = (file, location, message, cause) => {
    throw new ProjectError(file, location || '/', message, { cause });
  };
  const acquire = async (url, from, location) => {
    signal?.throwIfAborted();
    if (
      typeof url !== 'string' ||
      !url ||
      hasControlCharacters(url) ||
      /[?#\\]|^[a-z][a-z0-9+.-]*:|^\//i.test(url)
    )
      fail(
        from,
        location,
        'Expected a deployment-relative local path (no URL, query, fragment or absolute path).',
      );
    let decoded;
    try {
      decoded = decodeURIComponent(url);
    } catch (error) {
      fail(from, location, 'Malformed percent-encoded path.', error);
    }
    if (
      hasControlCharacters(decoded) ||
      /[?#\\]|^[a-z][a-z0-9+.-]*:|^\//i.test(decoded)
    )
      fail(from, location, 'Unsafe decoded deployment path.');
    const candidate = resolve(dirname(from), decoded);
    if (!contained(root, candidate))
      fail(from, location, `Path escapes project: ${url}`);
    let path;
    try {
      path = await realpath(candidate);
    } catch (error) {
      fail(from, location, `Missing reference: ${url}`, error);
    }
    if (!contained(root, path))
      fail(from, location, `Symlink escapes project: ${url}`);
    // Preserve the authored deployment path, not the symlink target's path.
    const name = relative(root, candidate).split('\\').join('/');
    if (
      name === 'project-manifest.json' ||
      name === 'SHA256SUMS' ||
      name.startsWith('__xyz/')
    )
      fail(from, location, 'Path is reserved for generated project output.');
    if (!files.has(name)) {
      const info = await stat(path);
      if (
        !info.isFile() ||
        info.size > assetRecipe.outputBytes ||
        files.size >= assetRecipe.outputFiles
      )
        fail(
          from,
          location,
          'Reference exceeds file/count budget or is not a regular file.',
        );
      bytes += info.size;
      if (bytes > assetRecipe.outputBytes)
        fail(from, location, 'Project exceeds aggregate byte budget.');
      const data = await readFile(path);
      signal?.throwIfAborted();
      if (data.length !== info.size)
        fail(from, location, 'File changed while reading.');
      files.set(name, {
        path: name,
        source: candidate,
        data,
        bytes: data.length,
        sha256: checksum(data),
      });
    }
    return files.get(name);
  };
  const decode = (file) => {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(file.data);
    } catch (error) {
      fail(file.source, '/', 'Invalid UTF-8.', error);
    }
  };
  const json = (file) => {
    try {
      return JSON.parse(decode(file));
    } catch (error) {
      fail(file.source, '/', `Invalid JSON: ${error.message}`, error);
    }
  };
  const ref = async (url, file, location, type) => {
    const target = await acquire(url, file.source, location);
    if (type) await inspect(target, type);
    return target;
  };
  const inspect = async (file, type) => {
    const key = `${type}:${file.path}`;
    if (visited.has(key)) return;
    visited.add(key);
    if (visited.size > assetRecipe.outputFiles)
      fail(file.source, '/', 'Dependency graph exceeds budget.');
    if (type === 'bitmapFont') {
      const { BitmapFontLoader } = await import(
        pathToFileURL(
          resolve(engineDirectory, 'packages/assets/src/fonts/bitmap-font.js'),
        )
      );
      let descriptor;
      try {
        descriptor = BitmapFontLoader.parse(
          decode(file),
          extname(file.path) === '.json' ? 'json' : 'text',
        );
      } catch (error) {
        fail(file.source, '/', error.message, error);
      }
      for (const [i, page] of descriptor.pages.entries())
        await ref(page, file, `/pages/${i}`, 'texture');
      return;
    }
    if (!['model', 'map', 'tileset', 'atlas', 'template'].includes(type))
      return;
    let document;
    try {
      document = type === 'model' ? parseModel(file.data).document : json(file);
    } catch (error) {
      fail(file.source, '/', error.message, error);
    }
    if (type === 'model') {
      if (
        document.extensionsRequired !== undefined &&
        !Array.isArray(document.extensionsRequired)
      )
        fail(
          file.source,
          '/extensionsRequired',
          'Expected required extension array.',
        );
      for (const [i, extension] of (
        document.extensionsRequired ?? []
      ).entries())
        if (!recipeSupportsExtension(extension))
          fail(
            file.source,
            `/extensionsRequired/${i}`,
            `Unsupported required glTF extension: ${extension}`,
          );
      for (const table of ['buffers', 'images'])
        for (const [i, entry] of (document[table] ?? []).entries())
          if (entry.uri !== undefined) {
            if (typeof entry.uri !== 'string')
              fail(
                file.source,
                `/${table}/${i}/uri`,
                'Expected resource URI string.',
              );
            if (!entry.uri.startsWith('data:'))
              await ref(entry.uri, file, `/${table}/${i}/uri`);
          }
      for (const [i, mesh] of (document.meshes ?? []).entries())
        for (const [j, primitive] of (mesh.primitives ?? []).entries()) {
          if ((primitive.mode ?? 4) !== 4)
            fail(
              file.source,
              `/meshes/${i}/primitives/${j}/mode`,
              'Only TRIANGLES topology is supported.',
            );
          for (const semantic of Object.keys(primitive.attributes ?? {}))
            if (
              /^TEXCOORD_/.test(semantic) &&
              !/^TEXCOORD_[01]$/.test(semantic)
            )
              fail(
                file.source,
                `/meshes/${i}/primitives/${j}/attributes/${semantic}`,
                'Only UV0 and UV1 are supported.',
              );
        }
      return;
    }
    if (type === 'atlas') {
      const pages = document.textures ?? [document];
      if (!Array.isArray(pages))
        fail(file.source, '/textures', 'Expected atlas page array.');
      for (const [i, page] of pages.entries()) {
        const base = document.textures ? `/textures/${i}` : '';
        await ref(
          page.meta?.image ?? page.image,
          file,
          `${base}/${page.meta?.image !== undefined ? 'meta/image' : 'image'}`,
          'texture',
        );
        for (const [j, related] of (
          page.meta?.related_multi_packs ?? []
        ).entries())
          await ref(
            related,
            file,
            `${base}/meta/related_multi_packs/${j}`,
            'atlas',
          );
      }
      return;
    }
    // Tiled JSON maps, external tilesets, nested groups and object templates share relative URLs.
    const walk = async (value, location = '', depth = 0) => {
      if (depth > 128)
        fail(file.source, location, 'JSON nesting exceeds budget.');
      if (!value || typeof value !== 'object') return;
      for (const [name, child] of Object.entries(value)) {
        const at = `${location}/${pointer(name)}`;
        if (name === 'image' && typeof child === 'string')
          await ref(child, file, at, 'texture');
        else if (name === 'source' && typeof child === 'string')
          await ref(child, file, at, 'tileset');
        else if (name === 'template' && typeof child === 'string')
          await ref(child, file, at, 'template');
        else if (name === 'value' && value.type === 'file' && child !== '')
          await ref(child, file, at);
        else await walk(child, at, depth + 1);
      }
    };
    await walk(document);
  };
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size > assetRecipe.profileBytes)
    fail(manifestPath, '/', 'Manifest exceeds byte budget.');
  const manifest = json({
    source: manifestPath,
    data: await readFile(manifestPath),
  });
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    fail(manifestPath, '/', 'Expected project manifest object.');
  if (manifest.version !== 1)
    fail(manifestPath, '/version', 'Expected project manifest version 1.');
  if (
    !Array.isArray(manifest.entries) ||
    !manifest.entries.length ||
    manifest.entries.length > rendering2dLimits.manifestEntries
  )
    fail(manifestPath, '/entries', 'Expected bounded nonempty entries.');
  const ids = new Map();
  for (const [i, entry] of manifest.entries.entries()) {
    if (
      !entry ||
      typeof entry.id !== 'string' ||
      !entry.id.trim() ||
      ids.has(entry.id)
    )
      fail(
        manifestPath,
        `/entries/${i}/id`,
        'IDs must be nonempty and unique.',
      );
    if (!types.has(entry.type))
      fail(
        manifestPath,
        `/entries/${i}/type`,
        `Unsupported asset type: ${entry.type}`,
      );
    if (
      entry.recipe !== undefined &&
      (entry.type !== 'model' || entry.recipe !== true)
    )
      fail(
        manifestPath,
        `/entries/${i}/recipe`,
        'recipe:true is only valid for models.',
      );
    const file = await acquire(entry.url, manifestPath, `/entries/${i}/url`);
    ids.set(entry.id, { entry, file, index: i });
    try {
      await inspect(file, entry.type);
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      fail(file.source, '/', error.message, error);
    }
  }
  for (const { entry, index } of ids.values()) {
    if (entry.dependsOn !== undefined && !Array.isArray(entry.dependsOn))
      fail(
        manifestPath,
        `/entries/${index}/dependsOn`,
        'Expected asset ID array.',
      );
    for (const [j, id] of (entry.dependsOn ?? []).entries())
      if (!ids.has(id))
        fail(
          manifestPath,
          `/entries/${index}/dependsOn/${j}`,
          `Missing asset ID: ${id}`,
        );
  }
  if (
    manifest.bundles !== undefined &&
    (!manifest.bundles ||
      typeof manifest.bundles !== 'object' ||
      Array.isArray(manifest.bundles) ||
      Object.keys(manifest.bundles).length > rendering2dLimits.manifestBundles)
  )
    fail(manifestPath, '/bundles', 'Invalid bounded bundles.');
  for (const [name, members] of Object.entries(manifest.bundles ?? {})) {
    if (
      !Array.isArray(members) ||
      members.length > rendering2dLimits.manifestEntries
    )
      fail(
        manifestPath,
        `/bundles/${pointer(name)}`,
        'Expected bounded asset ID array.',
      );
    for (const [i, id] of members.entries())
      if (!ids.has(id))
        fail(
          manifestPath,
          `/bundles/${pointer(name)}/${i}`,
          `Missing asset ID: ${id}`,
        );
  }
  return { manifestPath, root, manifest, files, ids };
}

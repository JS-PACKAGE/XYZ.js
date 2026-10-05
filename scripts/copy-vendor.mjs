import { cp, mkdir } from 'node:fs/promises';
import { URL } from 'node:url';

const destination = new URL('../dist/vendor/', import.meta.url);
await mkdir(destination, { recursive: true });
// Preserve unrelated local files; package/site inventories select only canonical vendor files.
await cp(
  new URL('../vendor/opm/', import.meta.url),
  new URL('opm/', destination),
  { recursive: true },
);
await cp(
  new URL('../vendor/mikktspace/', import.meta.url),
  new URL('mikktspace/', destination),
  { recursive: true },
);

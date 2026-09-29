import { cp, mkdir } from 'node:fs/promises';
import { URL } from 'node:url';

const destination = new URL('../dist/vendor/', import.meta.url);
await mkdir(destination, { recursive: true });
await cp(
  new URL('../vendor/opm/', import.meta.url),
  new URL('opm/', destination),
  { recursive: true },
);

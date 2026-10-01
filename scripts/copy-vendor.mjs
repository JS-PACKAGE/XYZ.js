import { cp, mkdir, rm } from 'node:fs/promises';
import { URL } from 'node:url';

const destination = new URL('../dist/vendor/', import.meta.url);
await mkdir(destination, { recursive: true });
// Generated deployment copies must exactly mirror the immutable official inventory.
await rm(new URL('opm/', destination), { recursive: true, force: true });
await cp(
  new URL('../vendor/opm/', import.meta.url),
  new URL('opm/', destination),
  { recursive: true },
);

import manifestText from '../vendor/opm/manifest.json?raw';
import versionModule from '../vendor/opm/dist/version.js?raw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { opmVendor } from '../src/data/opm.js';
import { AudioError } from '../packages/audio/src/errors.js';
import {
  OPMAdapter,
  resolveOPMModuleURL,
} from '../packages/audio/src/opm-adapter.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function page(href: string) {
  const url = new URL(href);
  vi.stubGlobal('location', { href: url.href, origin: url.origin });
  vi.stubGlobal('document', { baseURI: url.href });
}

describe('configured OPM module', () => {
  it('pins the same version as the vendored official bytes', () => {
    const manifest = JSON.parse(manifestText) as { version: string };
    expect(manifest.version).toBe(opmVendor.version);
    expect(versionModule).toContain(`"${opmVendor.version}"`);
  });

  it('accepts HTTPS anywhere and HTTP only on the page origin', () => {
    page('https://game.example/play/');
    const cdn =
      'https://cdn.jsdelivr.net/gh/JS-PACKAGE/OPM.js@d6b2780d6fca5475dfde3ea0f73767aa091f32f0/dist/api/index.js';
    expect(resolveOPMModuleURL(cdn)).toBe(cdn);
    expect(resolveOPMModuleURL(new URL(cdn))).toBe(cdn);
    expect(resolveOPMModuleURL('opm/dist/api/index.js')).toBe(
      'https://game.example/play/opm/dist/api/index.js',
    );
    expect(() =>
      resolveOPMModuleURL('http://game.example/opm/dist/api/index.js'),
    ).toThrow(AudioError);

    page('http://localhost:5173/');
    expect(resolveOPMModuleURL('/opm/dist/api/index.js')).toBe(
      'http://localhost:5173/opm/dist/api/index.js',
    );
    expect(() =>
      resolveOPMModuleURL('http://cdn.example/opm/dist/api/index.js'),
    ).toThrow(AudioError);
  });

  it('rejects credentials, fragments, non-HTTP schemes and malformed URLs', () => {
    page('https://game.example/');
    for (const input of [
      'https://user:secret@cdn.example/opm/dist/api/index.js',
      'https://cdn.example/opm/dist/api/index.js#api',
      'data:text/javascript,export const VERSION = "1.13.0"',
      'javascript:alert(1)',
      'https://[',
    ])
      expect(() => resolveOPMModuleURL(input), input).toThrow(AudioError);
  });

  it('refuses a module that does not report the vendored version', async () => {
    const adapter = new OPMAdapter();
    adapter.useModule(
      `data:text/javascript,${encodeURIComponent('export const VERSION = "1.12.0"; export class OPM {}')}`,
    );
    await expect(adapter.validate({})).rejects.toThrow(
      `XYZ.js requires official OPM.js ${opmVendor.version}`,
    );
    await expect(adapter.unlock()).rejects.toBeInstanceOf(AudioError);
    adapter.destroy();
  });
});

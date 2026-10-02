/* global document -- evaluated in an isolated Playwright page */
import { access } from 'node:fs/promises';
import process from 'node:process';

export const browserNames = ['chromium', 'firefox', 'webkit'];

/** Overrides must point to a Playwright-compatible engine, never a user profile. */
export async function browserLaunchOptions(browserName) {
  if (!browserNames.includes(browserName))
    throw new Error('Use --browser chromium|firefox|webkit.');
  const variable = `PLAYWRIGHT_${browserName.toUpperCase()}_EXECUTABLE_PATH`;
  const executablePath = process.env[variable];
  if (executablePath) {
    try {
      await access(executablePath);
    } catch (cause) {
      throw new Error(
        `${browserName} unavailable at ${executablePath}. Run pnpm exec playwright-core install ${browserName} or set ${variable} to a compatible managed executable.`,
        { cause },
      );
    }
  }
  if (browserName !== 'chromium')
    return { headless: true, ...(executablePath ? { executablePath } : {}) };
  return {
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--enable-unsafe-webgpu',
      ...(process.platform === 'linux'
        ? [
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--use-webgpu-adapter=swiftshader',
            // SwiftShader disables GL/WebGPU interop; canvas swap buffers need Vulkan backing.
            '--enable-features=Vulkan',
            '--use-vulkan=swiftshader',
          ]
        : process.platform === 'darwin'
          ? ['--use-angle=metal']
          : process.platform === 'win32'
            ? [
                // Windows Dawn selects by ANGLE's D3D11 LUID; WARP supplies it without a physical GPU.
                '--use-angle=d3d11-warp',
              ]
            : []),
    ],
  };
}

/** Compatibility for existing Chromium-only native GPU drivers. */
export async function chromiumLaunchOptions() {
  return browserLaunchOptions('chromium');
}

export function browserIdentity(
  browserName,
  browser,
  launch,
  mode = 'desktop-automation',
) {
  return {
    engine: browserName,
    version: browser?.version(),
    platform: `${process.platform}/${process.arch}`,
    mode,
    executable: launch?.executablePath ?? 'pinned-playwright-managed',
    physicalDeviceCertification: false,
    safariCertification: false,
  };
}

/** Probe native capability; successful probing is not rendering certification. */
export async function probeBackends(page) {
  return page.evaluate(async () => {
    const capabilities = {};
    for (const name of ['canvas2d', 'webgl2']) {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext(name === 'canvas2d' ? '2d' : name);
        capabilities[name] = {
          available: !!context,
          reason: context ? null : `${name} context creation returned null`,
        };
        if (name === 'webgl2' && context)
          context.getExtension('WEBGL_lose_context')?.loseContext();
      } catch (error) {
        capabilities[name] = { available: false, reason: String(error) };
      }
    }
    try {
      const adapter = await globalThis.navigator.gpu?.requestAdapter();
      capabilities.webgpu = {
        available: !!adapter,
        reason: adapter
          ? null
          : 'navigator.gpu absent or requestAdapter returned null',
      };
    } catch (error) {
      capabilities.webgpu = { available: false, reason: String(error) };
    }
    return capabilities;
  });
}

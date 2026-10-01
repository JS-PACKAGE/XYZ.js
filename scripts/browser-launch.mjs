import { access } from 'node:fs/promises';
import process from 'node:process';

/** Let pinned Playwright select its native headless executable, not a full app. */
export async function chromiumLaunchOptions() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (executablePath) {
    try {
      await access(executablePath);
    } catch (cause) {
      throw new Error(
        `Chromium unavailable at ${executablePath}. Run pnpm exec playwright-core install chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.`,
        { cause },
      );
    }
  }
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
          : []),
    ],
  };
}

import { access } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from 'playwright-core';

/** Use the revision installed by the repository's pinned playwright-core. */
export async function chromiumLaunchOptions() {
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    chromium.executablePath();
  try {
    await access(executablePath);
  } catch {
    throw new Error(
      'Chromium not found. Run pnpm exec playwright-core install chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.',
    );
  }
  return {
    headless: true,
    executablePath,
    args: [
      '--enable-unsafe-webgpu',
      ...(process.platform === 'linux'
        ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
        : process.platform === 'darwin'
          ? ['--use-angle=metal']
          : []),
    ],
  };
}

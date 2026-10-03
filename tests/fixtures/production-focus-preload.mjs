/* global document -- genuine owned-page focus transitions, no DOM state overrides */
import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from 'playwright-core';
import { productionWorkload } from '../../dist/src/data/observability.js';

const evidencePath = process.env.XYZ_PRODUCTION_FOCUS_EVIDENCE;
if (!evidencePath)
  throw new Error(
    'The foreground guard requires its own evidence destination.',
  );
const readState = (page) =>
  page.evaluate(() => ({
    visibility: document.visibilityState,
    focused: document.hasFocus(),
  }));
async function switchOwnedPage(page, newPage) {
  const evidence = {};
  let other;
  try {
    await page.waitForFunction(
      (minimum) =>
        globalThis.__xyzProductionForeground?.observerCallbacks >= minimum,
      productionWorkload.warmupFrames + 1,
      { timeout: 30000 },
    );
    evidence.before = await readState(page);
    other = await newPage();
    await other.goto('about:blank');
    await other.bringToFront();
    // Timer polling still observes the real document if the inactive tab stops RAF.
    await page.waitForFunction(
      () =>
        !document.hasFocus() &&
        globalThis.__xyzProductionForeground?.interruptedLifecycleEvents > 0,
      null,
      { polling: 25, timeout: 5000 },
    );
    evidence.during = await readState(page);
  } catch (error) {
    evidence.error = String(error);
  } finally {
    try {
      await page.bringToFront();
      await other?.close();
      await page.waitForFunction(
        () => document.hasFocus() && document.visibilityState === 'visible',
        null,
        { polling: 25, timeout: 5000 },
      );
      evidence.after = await readState(page);
    } catch (error) {
      evidence.error ??= String(error);
    }
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  }
}

const launch = chromium.launch.bind(chromium);
chromium.launch = async (options) => {
  const browser = await launch(options);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const context = await newContext(options);
    const newPage = context.newPage.bind(context);
    let firstPage = true;
    context.newPage = async () => {
      const page = await newPage();
      if (firstPage) {
        firstPage = false;
        void switchOwnedPage(page, newPage);
      }
      return page;
    };
    return context;
  };
  return browser;
};

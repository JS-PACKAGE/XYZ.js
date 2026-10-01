import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { I18n, I18nError } from '../packages/core/src/i18n.js';
import { Text2D } from '../packages/core/src/text2d.js';

beforeEach(() => {
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 1,
      height: 1,
      getContext: () => ({
        measureText: (text: string) => ({
          width: text.length * 12,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: text.length * 12,
          actualBoundingBoxAscent: 20,
          actualBoundingBoxDescent: 6,
        }),
        scale() {},
        fillText() {},
      }),
    }),
  });
  vi.stubGlobal('createImageBitmap', async () => ({
    width: 8,
    height: 8,
    close: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

const messages = {
  en: {
    menu: { start: 'Start', welcome: 'Hello, {name}!' },
    apples: { one: '{count} apple', other: '{count} apples' },
    braces: 'Use {{x}} for {name}',
    onlyEn: 'English only',
  },
  'zh-Hant': { menu: { start: '開始' }, apples: { other: '{count} 顆蘋果' } },
  'zh-Hant-TW': { menu: { welcome: '你好，{name}！' } },
};

it('flattens nested tables and walks the locale lineage then fallbacks', () => {
  const i18n = new I18n({
    locale: 'zh-Hant-TW',
    fallback: 'en',
    messages,
  });
  expect(i18n.t('menu.welcome', { name: '小語' })).toBe('你好，小語！');
  expect(i18n.t('menu.start')).toBe('開始');
  expect(i18n.t('onlyEn')).toBe('English only');
  expect(i18n.has('menu.nope')).toBe(false);
});

it('interpolates parameters, escapes braces and rejects missing parameters', () => {
  const i18n = new I18n({ messages });
  expect(i18n.t('braces', { name: 'a' })).toBe('Use {x} for a');
  expect(() => i18n.t('menu.welcome')).toThrow(I18nError);
  expect(i18n.t('menu.welcome', { name: 'A' })).toBe('Hello, A!');
});

it('selects plural forms with Intl.PluralRules and formats numbers per locale', () => {
  const en = new I18n({ messages });
  expect(en.t('apples', { count: 1 })).toBe('1 apple');
  expect(en.t('apples', { count: 1234 })).toBe('1,234 apples');
  expect(() => en.t('apples')).toThrow(/count/);
  const zh = new I18n({ locale: 'zh-Hant', messages });
  expect(zh.t('apples', { count: 1 })).toBe('1 顆蘋果');
  expect(new I18n({ locale: 'de' }).formatNumber(1234.5)).toBe('1.234,5');
});

it('applies the missing-key policy', () => {
  expect(new I18n().t('nope')).toBe('nope');
  expect(() => new I18n({ missing: 'error' }).t('nope')).toThrow(I18nError);
  expect(
    new I18n({ locale: 'fr', missing: (key, locale) => `${locale}:${key}` }).t(
      'nope',
    ),
  ).toBe('fr:nope');
});

it('rejects malformed locale tags and tables', () => {
  expect(() => new I18n({ locale: 'not a locale' })).toThrow(I18nError);
  const i18n = new I18n();
  expect(() => i18n.addMessages('en', { 'a.b': 'x' })).toThrow(I18nError);
  expect(() => i18n.addMessages('en', { a: 5 as unknown as string })).toThrow(
    I18nError,
  );
  expect(i18n.locales).toEqual([]);
});

it('notifies listeners once per real locale change', () => {
  const i18n = new I18n({ messages });
  const seen: string[] = [];
  i18n.addEventListener('localechange', (event) =>
    seen.push((event as CustomEvent<{ locale: string }>).detail.locale),
  );
  i18n.setLocale('en');
  i18n.setLocale('zh-Hant');
  expect(seen).toEqual(['zh-Hant']);
  expect(i18n.locale).toBe('zh-Hant');
});

it('keeps bound Text2D in sync, stops after unbind and ignores destroyed text', async () => {
  const i18n = new I18n({ fallback: 'en', messages });
  const label = await Text2D.create('placeholder');
  const binding = i18n.bindText(label, 'menu.start');
  await binding.refresh();
  expect(label.text).toBe('Start');
  i18n.setLocale('zh-Hant');
  await binding.refresh();
  expect(label.text).toBe('開始');
  binding.unbind();
  i18n.setLocale('en');
  await Promise.resolve();
  expect(label.text).toBe('開始');

  const other = await Text2D.create('x');
  i18n.bindText(other, 'menu.start');
  other.destroy();
  expect(() => i18n.setLocale('zh-Hant')).not.toThrow();
});

import {
  BrowserTextLayout,
  Game,
  Scene,
  Text2D,
  Vector2,
  UILabel,
  UITextInput,
  UIRoot,
  graphemeBoundaries,
} from '../src/index.js';
import type {
  RendererPreference,
  Text2DOptions,
  TextSelectionRect,
} from '../src/index.js';

/** Real canvas UI/native editing fixture, served by Vite; no synthetic IME proof. */
export async function installTextLayoutSmoke(canvas: HTMLCanvasElement) {
  const fields: UITextInput[] = [];
  const events: {
    type: string;
    trusted: boolean;
    composing: boolean;
    value: string;
  }[] = [];
  const failures: string[] = [];
  const game = await Game.create({
    canvas,
    width: 960,
    height: 470,
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'canvas2d') as RendererPreference,
  });
  try {
    const styles: Text2DOptions[] = [
      { direction: 'rtl', locale: 'ar' },
      { direction: 'auto', locale: 'he' },
      { direction: 'ltr', locale: 'en' },
      { direction: 'auto', locale: 'ja' },
    ];
    const values = [
      'العربية abc 123 שלום ٤٥٦ نهاية',
      'עברית ABC 123 العربية 456 סוף',
      'office fi ffi e\u0301 👨‍👩‍👧‍👦 🇯🇵 👍🏽',
      '日本語 中文 한국어 abc 123',
    ];
    const labels = [
      'Arabic / Latin / numbers / Hebrew',
      'Hebrew auto paragraph / Arabic / numbers',
      'Ligatures / combining accent / ZWJ family / flags',
      'CJK system fallback after declared Latin font readiness',
    ];
    let root: UIRoot | undefined;
    class TextSmokeScene extends Scene {
      protected override async initialize(
        _game: Game,
        signal: AbortSignal,
      ): Promise<void> {
        root = this.add(
          new UIRoot(game, { direction: 'column', gap: 10, padding: 20 }),
        );
        for (let i = 0; i < values.length; i++) {
          signal.throwIfAborted();
          root.add(
            await UILabel.create(labels[i]!, {
              layout: { height: 24 },
              textStyle: { fontSize: 16 },
            }),
          );
          const field = await UITextInput.create({
            value: values[i],
            label: labels[i],
            layout: { width: 920, height: 64 },
            textStyle: {
              fontSize: 28,
              fontFamily: 'XYZSmokeAbel',
              fontFallback: 'system-ui, sans-serif',
              fontReadiness: 'wait',
              resolution: 2,
              ...styles[i],
            },
          });
          if (signal.aborted) {
            field.destroy();
            signal.throwIfAborted();
          }
          root.add(field);
          fields.push(field);
          for (const type of [
            'input',
            'compositionstart',
            'compositionupdate',
            'compositionend',
          ]) {
            field.addEventListener(type, (event) => {
              const detail = (event as CustomEvent<{ originalEvent: Event }>)
                .detail;
              events.push({
                type,
                trusted: detail.originalEvent.isTrusted,
                composing: field.isComposing,
                value: field.value,
              });
            });
          }
        }
        root.reflow();
      }
    }
    game.addEventListener('error', (event) =>
      failures.push(String((event as CustomEvent).detail)),
    );
    await game.setScene(new TextSmokeScene());
    game.start();
    const probe = new BrowserTextLayout();
    const proofCases: {
      name: string;
      field: number;
      start: number;
      end: number;
      expectedRectangles: readonly TextSelectionRect[];
    }[] = [];
    const caretExpectations: {
      label: string;
      actual: number;
      expected: number;
      tolerance: number;
    }[] = [];
    try {
      const style = {
        fontSize: 28,
        fontFamily: 'XYZSmokeAbel',
        fontFallback: 'system-ui, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        lineHeight: 33.6,
        direction: 'rtl' as const,
        locale: 'he',
      };
      probe.setText('אבג', style);
      // Compare native caret coordinates, not paragraph width: WebKit's collapsed
      // Range positions are pixel-quantized even when text advances are fractional.
      const nativeParagraph = document.createElement('span');
      nativeParagraph.dir = 'rtl';
      nativeParagraph.lang = 'he';
      nativeParagraph.style.cssText =
        'all:initial;position:fixed;left:0;top:0;display:inline-block;white-space:pre;opacity:0;pointer-events:none;unicode-bidi:isolate;';
      nativeParagraph.style.font =
        'normal normal 28px XYZSmokeAbel, system-ui, sans-serif';
      nativeParagraph.style.lineHeight = '33.6px';
      nativeParagraph.textContent = 'אבג';
      document.body.append(nativeParagraph);
      try {
        const range = document.createRange();
        const nativeCaret = (index: number) => {
          range.setStart(nativeParagraph.firstChild!, index);
          range.collapse(true);
          return (
            range.getBoundingClientRect().left -
            nativeParagraph.getBoundingClientRect().left
          );
        };
        const start = nativeCaret(0),
          end = nativeCaret(3);
        if (!(start > end))
          failures.push(
            'Native RTL paragraph did not place logical start right of logical end.',
          );
        caretExpectations.push(
          {
            label: 'RTL logical start matches native visual right caret',
            actual: probe.caret(0).x,
            expected: start,
            tolerance: 0.5,
          },
          {
            label: 'RTL logical end matches native visual left caret',
            actual: probe.caret(3, 'upstream').x,
            expected: end,
            tolerance: 0.5,
          },
        );
      } finally {
        nativeParagraph.remove();
      }
      for (const expectation of caretExpectations)
        if (
          Math.abs(expectation.actual - expectation.expected) >
          expectation.tolerance
        )
          failures.push(expectation.label);
      probe.setText(values[0]!, { ...style, locale: 'ar' });
      searchSelection: for (let start = 0; start < values[0]!.length; start++) {
        for (let end = start + 1; end <= values[0]!.length; end++) {
          const rects = [...probe.selection(start, end)].sort(
            (a, b) => a.x - b.x,
          );
          if (
            rects.some(
              (rect, index) =>
                index > 0 &&
                rect.x - (rects[index - 1]!.x + rects[index - 1]!.width) > 1,
            )
          ) {
            proofCases.push({
              name: 'bidi-disjoint',
              field: 0,
              start,
              end,
              expectedRectangles: rects,
            });
            break searchSelection;
          }
        }
      }
      if (proofCases.length !== 1)
        failures.push(
          'Mixed bidi selection did not expose separated visual rectangles.',
        );
      const clusterText = 'e\u0301 👨‍👩‍👧‍👦 🇯🇵 👍🏽 office ffi';
      probe.setText(clusterText, { ...style, direction: 'ltr', locale: 'en' });
      const boundaries = graphemeBoundaries(clusterText, 'en');
      for (let x = -10; x <= probe.width + 10; x += 0.5) {
        if (!boundaries.includes(probe.hitTest(x).index)) {
          failures.push('Pointer hit entered a grapheme cluster.');
          break;
        }
      }
      const familyStart = clusterText.indexOf('👨');
      const familyEnd = familyStart + '👨‍👩‍👧‍👦'.length;
      if (
        probe.caret(familyStart + 2).index !== familyEnd ||
        probe.caret(familyStart + 2, 'upstream').index !== familyStart
      )
        failures.push(
          'Visual UTF-16 selection did not snap to the complete ZWJ family.',
        );
      probe.setText('fi', { ...style, direction: 'ltr', locale: 'en' });
      const a = probe.caret(0).x,
        b = probe.caret(1).x,
        c = probe.caret(2, 'upstream').x;
      if (!(a < b && b < c))
        failures.push('Shaped ligature interior caret is not measurable.');
      const fieldFamilyStart = values[2]!.indexOf('👨');
      const fieldFamilyEnd = fieldFamilyStart + '👨‍👩‍👧‍👦'.length;
      probe.setText(values[2]!, { ...style, direction: 'ltr', locale: 'en' });
      const expectedFamily = probe.selection(fieldFamilyStart, fieldFamilyEnd);
      fields[2]!.setSelectionRange(fieldFamilyStart + 2, fieldFamilyEnd - 2);
      const actualFamily = fields[2]!.selectionGeometry.rectangles;
      if (
        actualFamily.length !== 1 ||
        expectedFamily.length !== 1 ||
        Math.abs(actualFamily[0]!.width - expectedFamily[0]!.width) > 0.5
      )
        failures.push(
          'Interior ZWJ native selection does not paint the complete family cluster.',
        );
      if (
        fields[2]!.selectionStart !== fieldFamilyStart + 2 ||
        fields[2]!.selectionEnd !== fieldFamilyEnd - 2
      )
        failures.push('Native UTF-16 selection was rewritten.');
      proofCases.push({
        name: 'zwj-cluster',
        field: 2,
        start: fieldFamilyStart + 2,
        end: fieldFamilyEnd - 2,
        expectedRectangles: expectedFamily,
      });
      const bidi = proofCases.find((proof) => proof.name === 'bidi-disjoint');
      if (bidi) fields[0]!.setSelectionRange(bidi.start, bidi.end);
      root?.focus.focus(fields[0]!);
    } finally {
      probe.destroy();
    }
    return {
      game,
      fields,
      events,
      failures,
      proofCases,
      caretExpectations,
      ready: true,
      backend: game.graphics.backend,
      fontReady: document.fonts.status,
      select(index: number, start: number, end: number) {
        const field = fields[index]!;
        root?.focus.focus(field);
        field.setSelectionRange(start, end);
        return field.selectionGeometry;
      },
      async showRTLViewportProof() {
        const field = fields[1]!;
        const origin = field.toWorld(new Vector2());
        const reference = document.createElement('canvas');
        reference.width = field.layoutWidth;
        reference.height = field.layoutHeight;
        const context = reference.getContext('2d')!;
        context.font = 'normal normal 28px XYZSmokeAbel, system-ui, sans-serif';
        context.direction = 'rtl';
        context.textAlign = 'left';
        context.fillStyle = '#ffffff';
        context.fillText(field.value, 8, 40);
        const ink = (pixels: Uint8ClampedArray, width: number) => {
          let left = width,
            right = -1,
            count = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (
              pixels[i]! > 200 &&
              pixels[i + 1]! > 200 &&
              pixels[i + 2]! > 200 &&
              pixels[i + 3]! > 200
            ) {
              const x = (i / 4) % width;
              left = Math.min(left, x);
              right = Math.max(right, x);
              count++;
            }
          return { width: right - left + 1, count };
        };
        const expected = ink(
          context.getImageData(0, 0, reference.width, reference.height).data,
          reference.width,
        );
        return new Promise((resolve) =>
          requestAnimationFrame(() => {
            const copy = document.createElement('canvas');
            copy.width = canvas.width;
            copy.height = canvas.height;
            const capture = copy.getContext('2d')!;
            capture.drawImage(canvas, 0, 0);
            const scale = canvas.width / game.width;
            const width = Math.round(field.layoutWidth * scale);
            const actual = ink(
              capture.getImageData(
                Math.round(origin.x * scale),
                Math.round(origin.y * scale),
                width,
                Math.round(field.layoutHeight * scale),
              ).data,
              width,
            );
            resolve({
              expected,
              actual: { width: actual.width / scale, count: actual.count },
              png: copy.toDataURL('image/png'),
            });
          }),
        );
      },
      async showProof(name: string) {
        const proof = proofCases.find((candidate) => candidate.name === name);
        if (!proof) throw new Error(`Unknown text proof: ${name}`);
        const field = fields[proof.field]!;
        root?.focus.focus(field);
        // Same active caret in both captures: changed pixels must come from the
        // canvas selection rectangles, not from moving a one-pixel caret.
        field.setSelectionRange(proof.end, proof.end);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const beforePng = canvas.toDataURL('image/png');
        field.setSelectionRange(proof.start, proof.end);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const input = document.activeElement as HTMLInputElement;
        if (
          input.selectionStart !== proof.start ||
          input.selectionEnd !== proof.end ||
          field.selectionStart !== proof.start ||
          field.selectionEnd !== proof.end
        )
          throw new Error(
            'Selection painting rewrote the native UTF-16 selection.',
          );
        const graphic = [...field.children].find(
          (child) => child instanceof Text2D,
        )!;
        const origin = field.toWorld(
          new Vector2(graphic.position.x, graphic.position.y),
        );
        const geometry = field.selectionGeometry;
        return {
          geometry,
          beforePng,
          png: canvas.toDataURL('image/png'),
          regions: geometry.rectangles.map((rect) => ({
            x: origin.x + rect.x,
            y: origin.y + rect.y,
            width: rect.width,
            height: rect.height,
          })),
          logicalWidth: game.width,
          logicalHeight: game.height,
        };
      },
      async showCaretProof(index: number) {
        const field = fields[index]!;
        const geometry = field.selectionGeometry;
        const input = document.activeElement as HTMLInputElement;
        if (
          field.selectionStart !== field.selectionEnd ||
          geometry.caret.index !== field.selectionEnd ||
          input.selectionStart !== field.selectionStart ||
          input.selectionEnd !== field.selectionEnd
        )
          throw new Error(
            'Native selection and rendered caret differ after trusted editing.',
          );
        const graphic = [...field.children].find(
          (child) => child instanceof Text2D,
        )!;
        const origin = field.toWorld(
          new Vector2(graphic.position.x, graphic.position.y),
        );
        root?.focus.focus(undefined);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const beforePng = canvas.toDataURL('image/png');
        root?.focus.focus(field);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return {
          geometry,
          beforePng,
          png: canvas.toDataURL('image/png'),
          regions: [
            {
              x: origin.x + geometry.caret.x,
              y: origin.y,
              width: 1,
              height: graphic.height,
            },
          ],
          logicalWidth: game.width,
          logicalHeight: game.height,
        };
      },
      async refreshFonts() {
        await Promise.all(fields.map((field) => field.refreshFonts()));
      },
      dispose() {
        game.destroy();
      },
    };
  } catch (error) {
    game.destroy();
    throw error;
  }
}

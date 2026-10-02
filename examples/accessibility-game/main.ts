import {
  Game,
  Scene,
  UIRoot,
  UIElement,
  UIButton,
  UILabel,
  Sprite,
  Graphics2D,
  GraphicsPath2D,
  type RendererPreference,
  type Tween,
} from '../../src/index.js';

const messages = {
  en: {
    title: 'Beacon route',
    notice:
      'Canvas game. Tab: controls. Enter: activate. Escape: close settings or errors. No time limit.',
    gallery: 'Back to examples',
    menu: 'Main menu',
    start: 'Start route',
    settings: 'Settings',
    destroy: 'Destroy game',
    destroyed:
      'Game destroyed. All owned semantic controls and live regions removed.',
    instructions:
      'Move with Left / Right. Collect with {key}. Visit beacons at positions 3, 5, then 2. Tab opens controls.',
    gameplay: 'Route in progress',
    state: 'Position {position} of 5. Target {target}. Collected {count} of 3.',
    resume: 'Resume route',
    leave: 'Return to menu',
    replay: 'Play again',
    results: 'Route complete: all 3 beacons collected.',
    errorTitle: 'Collection error',
    error: 'No beacon here. Move to position {target} before collecting.',
    recover: 'Return to route',
    settingsTitle: 'Accessibility settings',
    scale: 'Text size: {size} percent',
    contrast: 'High contrast: {value}',
    motion: 'Reduced motion: {value}',
    locale: 'Language: English',
    rebind: 'Collect key: {key}. Remap',
    close: 'Close settings',
    on: 'On',
    off: 'Off',
    capture:
      'Press a letter or number for collect. Escape cancels. Navigation keys are reserved.',
    bound: 'Collect is now mapped to {key}.',
    cancel: 'Key remapping cancelled.',
    invalid: 'Choose a letter or number. This key is reserved.',
    progress: 'Beacon collected. {count} of 3.',
    fatal: 'The game could not start. {error}',
  },
  'zh-Hant': {
    title: '燈塔路線',
    notice:
      'Canvas 遊戲。Tab 選控制項，Enter 啟用，Escape 關閉設定或錯誤。沒有時間限制。',
    gallery: '返回範例總覽',
    menu: '主選單',
    start: '開始路線',
    settings: '設定',
    destroy: '銷毀遊戲',
    destroyed: '遊戲已銷毀。所有自有語意控制項與即時公告區已移除。',
    instructions:
      '左右方向鍵移動，{key} 收集。依序拜訪第 3、5、2 格的燈塔。Tab 開啟控制項。',
    gameplay: '路線進行中',
    state:
      '目前第 {position} 格，共 5 格。目標第 {target} 格。已收集 {count} 個，共 3 個。',
    resume: '繼續路線',
    leave: '返回主選單',
    replay: '再玩一次',
    results: '路線完成：已收集全部 3 個燈塔。',
    errorTitle: '收集錯誤',
    error: '這裡沒有燈塔。請先移動到第 {target} 格再收集。',
    recover: '返回路線',
    settingsTitle: '無障礙設定',
    scale: '文字大小：百分之 {size}',
    contrast: '高對比：{value}',
    motion: '減少動態：{value}',
    locale: '語言：繁體中文',
    rebind: '收集按鍵：{key}。重新指定',
    close: '關閉設定',
    on: '開啟',
    off: '關閉',
    capture: '請按英文字母或數字指定收集按鍵。Escape 取消。導覽按鍵保留。',
    bound: '收集已指定為 {key}。',
    cancel: '已取消按鍵指定。',
    invalid: '請選英文字母或數字。這個按鍵已保留。',
    progress: '已收集燈塔。目前 {count} 個，共 3 個。',
    fatal: '遊戲無法啟動。{error}',
  },
};
const notice = document.querySelector<HTMLParagraphElement>('#notice')!;
const gallery = document.querySelector<HTMLAnchorElement>('#gallery')!;
gallery.textContent =
  messages[
    new URLSearchParams(location.search).get('locale') === 'zh-Hant'
      ? 'zh-Hant'
      : 'en'
  ].gallery;
let game: Game | undefined;
let scene: Route | undefined;
const listeners = new AbortController();
const release = (): void => {
  listeners.abort();
  game?.destroy();
};
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

class Route extends Scene {
  private readonly runtime: Game;
  readonly root: UIRoot;
  private readonly panels: Record<
    'menu' | 'play' | 'results' | 'settings' | 'error',
    UIElement
  >;
  private readonly texts: {
    node: UILabel | UIButton;
    key: string;
    params?: () => Record<string, string | number>;
  }[] = [];
  private readonly stateText: UILabel;
  private readonly errorText: UILabel;
  private readonly decoration: Sprite;
  private readonly player: Sprite;
  private readonly beacons: Sprite[];
  private readonly targets = [2, 4, 1];
  private stage: 'menu' | 'play' | 'results' = 'menu';
  private position = 0;
  private count = 0;
  private collectKey = 'KeyE';
  private capturing = false;
  private phase = 0;
  private motion?: Tween;
  private releaseMotion?: () => void;
  private refreshTask = Promise.resolve();
  private readonly announcements: Partial<
    Record<
      'polite' | 'assertive',
      { key: string; params?: Record<string, string | number> }
    >
  > = {};

  private constructor(
    runtime: Game,
    root: UIRoot,
    panels: Route['panels'],
    stateText: UILabel,
    errorText: UILabel,
    decoration: Sprite,
    player: Sprite,
    beacons: Sprite[],
  ) {
    super();
    this.runtime = runtime;
    this.root = this.add(root);
    this.panels = panels;
    this.stateText = stateText;
    this.errorText = errorText;
    this.decoration = this.add(decoration);
    this.player = this.add(player);
    this.beacons = beacons.map((beacon) => this.add(beacon));
    runtime.input.actions.bind('routeLeft', { key: 'ArrowLeft' });
    runtime.input.actions.bind('routeRight', { key: 'ArrowRight' });
    runtime.input.actions.bind('routeCollect', { key: this.collectKey });
    this.releaseMotion = runtime.preferences.bindMotion((enabled) => {
      if (!enabled) {
        if (this.motion && !this.motion.completed)
          this.motion.seek(this.motion.totalDuration);
        this.decoration.rotation = 0;
      }
    });
    runtime.i18n.addEventListener(
      'localechange',
      () => {
        void this.refresh().catch((error: unknown) => this.reportError(error));
      },
      { signal: listeners.signal },
    );
    runtime.preferences.addEventListener(
      'change',
      () => {
        void this.refresh().catch((error: unknown) => this.reportError(error));
      },
      { signal: listeners.signal },
    );
    root.addEventListener('error', (event) =>
      this.reportError((event as CustomEvent<unknown>).detail),
    );
    runtime.canvas.ownerDocument.addEventListener(
      'keydown',
      (event) => {
        if (
          !this.capturing ||
          event.repeat ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.isComposing
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.code === 'Escape') {
          this.capturing = false;
          this.announce('cancel');
        } else if (/^(Key[A-Z]|Digit[0-9])$/.test(event.code)) {
          this.collectKey = event.code;
          runtime.input.actions.rebind('routeCollect', [{ key: event.code }]);
          this.capturing = false;
          this.announce('bound', { key: event.code });
          void this.refresh().catch((error: unknown) =>
            this.reportError(error),
          );
        } else this.announce('invalid');
      },
      { capture: true, signal: listeners.signal },
    );
  }

  static async create(runtime: Game): Promise<Route> {
    const root = new UIRoot(runtime, { direction: 'overlay', padding: 30 });
    let candidate: Route | undefined;
    try {
      const makePanel = (): UIElement =>
        root.add(
          new UIElement({
            direction: 'column',
            width: 'fill',
            height: 'auto',
            gap: 14,
            align: 'stretch',
          }),
        );
      const panels = {
        menu: makePanel(),
        play: makePanel(),
        results: makePanel(),
        settings: makePanel(),
        error: makePanel(),
      };
      const stateText = panels.play.add(
        await UILabel.create('', {
          label: '',
          layout: { height: 'auto' },
          textStyle: { fontSize: 22, wrapWidth: 980 },
        }),
      );
      const errorText = panels.error.add(
        await UILabel.create('', {
          label: '',
          layout: { height: 'auto' },
          textStyle: { fontSize: 22, wrapWidth: 980 },
        }),
      );
      const square = await Graphics2D.create([
        {
          path: new GraphicsPath2D([
            { op: 'rect', x: 0, y: 0, width: 1, height: 1 },
          ]),
          fill: '#ffffff',
        },
      ]);
      const player = new Sprite({ texture: square.texture, anchor: [0, 0] });
      player.scale.set(50, 50);
      player.space = 'screen';
      const beacons = Array.from({ length: 5 }, () => {
        const sprite = new Sprite({ texture: square.texture, anchor: [0, 0] });
        sprite.scale.set(100, 30);
        sprite.space = 'screen';
        return sprite;
      });
      square.space = 'screen';
      square.scale.set(30, 30);
      square.position.set(1020, 35);
      const route = new Route(
        runtime,
        root,
        panels,
        stateText,
        errorText,
        square,
        player,
        beacons,
      );
      candidate = route;
      const label = async (
        panel: UIElement,
        key: string,
        fontSize = 28,
      ): Promise<void> => {
        const node = panel.add(
          await UILabel.create(runtime.i18n.t(key), {
            label: runtime.i18n.t(key),
            layout: { height: 'auto' },
            textStyle: { fontSize, wrapWidth: 980 },
          }),
        );
        route.texts.push({ node, key });
      };
      const button = async (
        panel: UIElement,
        key: string,
        action: () => void,
        params?: () => Record<string, string | number>,
      ): Promise<UIButton> => {
        const node = panel.add(
          await UIButton.create(runtime.i18n.t(key, params?.()), {
            layout: { width: 'fill', height: 52 },
            textStyle: { fontSize: 22, wrapWidth: 960 },
          }),
        );
        route.texts.push({ node, key, params });
        node.addEventListener('click', action);
        return node;
      };
      await label(panels.menu, 'title');
      await label(panels.menu, 'menu');
      const start = await button(panels.menu, 'start', () => route.begin());
      await button(panels.menu, 'settings', () => route.openSettings());
      await button(panels.menu, 'destroy', () => {
        notice.textContent = runtime.i18n.t('destroyed');
        release();
      });
      await button(panels.menu, 'gallery', () => {
        release();
        location.href = new URL('../', location.href).href;
      });
      await label(panels.play, 'gameplay');
      const instructions = panels.play.add(
        await UILabel.create('', {
          label: '',
          textStyle: { fontSize: 22, wrapWidth: 980 },
        }),
      );
      route.texts.push({
        node: instructions,
        key: 'instructions',
        params: () => ({ key: route.collectKey }),
      });
      await button(panels.play, 'resume', () => route.focusCanvas());
      await button(panels.play, 'settings', () => route.openSettings());
      await button(panels.play, 'leave', () => route.show('menu'));
      await label(panels.results, 'results');
      await button(panels.results, 'replay', () => route.begin());
      await button(panels.results, 'settings', () => route.openSettings());
      await button(panels.results, 'leave', () => route.show('menu'));
      await label(panels.settings, 'settingsTitle');
      panels.settings.accessibility = {
        role: 'dialog',
        label: runtime.i18n.t('settingsTitle'),
        tabIndex: -1,
        modal: true,
      };
      const closeSettings = (): void => {
        route.capturing = false;
        panels.settings.setVisible(false);
        panels[route.stage].setVisible(true);
        root.focus.popModal();
      };
      panels.settings.addEventListener('modalclose', () => {
        if (route.capturing) {
          route.capturing = false;
          route.announce('cancel');
        } else closeSettings();
      });
      await button(
        panels.settings,
        'scale',
        () =>
          runtime.preferences.set({
            textScale: runtime.preferences.values.textScale === 2 ? 1 : 2,
          }),
        () => ({ size: runtime.preferences.values.textScale * 100 }),
      );
      await button(
        panels.settings,
        'contrast',
        () =>
          runtime.preferences.set({
            highContrast: !runtime.preferences.values.highContrast,
          }),
        () => ({
          value: runtime.i18n.t(
            runtime.preferences.values.highContrast ? 'on' : 'off',
          ),
        }),
      );
      await button(
        panels.settings,
        'motion',
        () =>
          runtime.preferences.set({
            reducedMotion: !runtime.preferences.values.reducedMotion,
          }),
        () => ({
          value: runtime.i18n.t(
            runtime.preferences.values.reducedMotion ? 'on' : 'off',
          ),
        }),
      );
      await button(panels.settings, 'locale', () =>
        runtime.i18n.setLocale(runtime.i18n.locale === 'en' ? 'zh-Hant' : 'en'),
      );
      await button(
        panels.settings,
        'rebind',
        () => {
          route.capturing = true;
          route.announce('capture');
        },
        () => ({ key: route.collectKey }),
      );
      await button(panels.settings, 'close', closeSettings);
      await label(panels.error, 'errorTitle');
      panels.error.accessibility = {
        role: 'dialog',
        label: runtime.i18n.t('errorTitle'),
        tabIndex: -1,
        modal: true,
      };
      const recover = (): void => {
        panels.error.setVisible(false);
        panels.play.setVisible(true);
        root.focus.popModal();
        route.focusCanvas();
        delete route.announcements.assertive;
        runtime.accessibility.clearAnnouncements('assertive');
      };
      panels.error.addEventListener('modalclose', recover);
      await button(panels.error, 'recover', recover);
      for (const panel of Object.values(panels)) panel.setVisible(false);
      panels.menu.setVisible(true);
      await route.refresh();
      root.focus.focus(start);
      return route;
    } catch (error) {
      candidate?.destroy();
      root.destroy();
      throw error;
    }
  }
  private announce(
    key: string,
    params?: Record<string, string | number>,
    priority: 'polite' | 'assertive' = 'polite',
  ): void {
    this.announcements[priority] = { key, params };
    this.runtime.accessibility.announce(this.runtime.i18n.t(key, params), {
      priority,
      language: this.runtime.i18n.locale,
    });
  }
  private reportError(error: unknown): void {
    this.announce(
      'fatal',
      { error: error instanceof Error ? error.message : String(error) },
      'assertive',
    );
    notice.textContent = this.runtime.i18n.t('fatal', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  private refresh(): Promise<void> {
    this.refreshTask = this.refreshTask
      .catch(() => {})
      .then(async () => {
        if (this.destroyed) return;
        const i18n = this.runtime.i18n;
        document.documentElement.lang = i18n.locale;
        document.title = i18n.t('title');
        notice.textContent = i18n.t('notice');
        gallery.textContent = i18n.t('gallery');
        this.runtime.canvas.setAttribute('aria-label', i18n.t('title'));
        await Promise.all(
          this.texts.map(({ node, key, params }) =>
            node.setText(i18n.t(key, params?.())),
          ),
        );
        for (const [key, panel] of [
          ['settingsTitle', this.panels.settings],
          ['errorTitle', this.panels.error],
        ] as const)
          panel.accessibility = {
            ...panel.accessibility!,
            label: i18n.t(key),
            language: i18n.locale,
          };
        await this.syncState(false);
        await this.root.applyPreferences(this.runtime.preferences.values);
        for (const priority of ['polite', 'assertive'] as const) {
          const announcement = this.announcements[priority];
          if (announcement)
            this.announce(announcement.key, announcement.params, priority);
        }
        const contrast = this.runtime.preferences.values.highContrast;
        this.decoration.tint = contrast ? [1, 1, 0, 1] : [0.3, 0.8, 1, 1];
        this.player.tint = contrast ? [1, 1, 1, 1] : [0.2, 0.8, 1, 1];
        this.paintBoard();
      });
    return this.refreshTask;
  }
  private paintBoard(): void {
    const visible = this.stage === 'play';
    this.player.visible = visible;
    for (const [index, beacon] of this.beacons.entries()) {
      beacon.visible = visible;
      beacon.position.set(100 + index * 175, 760);
      const target = index === this.targets[this.count];
      beacon.tint = target
        ? [1, 0.8, 0, 1]
        : this.runtime.preferences.values.highContrast
          ? [0.5, 0.5, 0.5, 1]
          : [0.15, 0.25, 0.4, 1];
      beacon.scale.y = target ? 50 : 20;
    }
  }
  private async syncState(announce: boolean): Promise<void> {
    const target = (this.targets[this.count] ?? 0) + 1;
    const text = this.runtime.i18n.t('state', {
      position: this.position + 1,
      target,
      count: this.count,
    });
    await this.stateText.setText(text);
    this.runtime.canvas.setAttribute(
      'aria-description',
      this.runtime.i18n.t('instructions', { key: this.collectKey }) +
        ' ' +
        text,
    );
    await this.errorText.setText(this.runtime.i18n.t('error', { target }));
    if (announce)
      this.announce('state', {
        position: this.position + 1,
        target,
        count: this.count,
      });
  }
  private show(stage: Route['stage']): void {
    this.stage = stage;
    for (const [key, panel] of Object.entries(this.panels))
      panel.setVisible(key === stage);
    this.paintBoard();
    this.root.reflow();
    this.root.focus.move(1);
    this.announce(
      stage === 'results' ? 'results' : stage === 'menu' ? 'menu' : 'gameplay',
    );
  }
  private begin(): void {
    this.position = 0;
    this.count = 0;
    this.player.position.set(100, 690);
    this.show('play');
    this.focusCanvas();
    void this.syncState(true).catch((error: unknown) =>
      this.reportError(error),
    );
  }
  private focusCanvas(): void {
    this.root.focus.focus(undefined);
    this.runtime.canvas.focus({ preventScroll: true });
  }
  private openSettings(): void {
    this.panels.settings.setVisible(true);
    this.root.focus.pushModal(this.panels.settings);
    this.panels[this.stage].setVisible(false);
    this.announce('settingsTitle');
  }
  override update(delta: number): void {
    this.phase += this.runtime.preferences.delta(delta);
    this.decoration.rotation = this.runtime.preferences.values.reducedMotion
      ? 0
      : Math.sin(this.phase * 2) * 0.3;
    this.paintBoard();
    if (
      this.stage !== 'play' ||
      this.root.focus.modal ||
      document.activeElement !== this.runtime.canvas
    )
      return;
    const actions = this.runtime.input.actions;
    const direction = actions.wasPressed('routeRight')
      ? 1
      : actions.wasPressed('routeLeft')
        ? -1
        : 0;
    if (direction) {
      this.position = Math.max(0, Math.min(4, this.position + direction));
      if (this.motion && !this.motion.completed)
        this.motion.seek(this.motion.totalDuration);
      this.motion = this.runtime.preferences.tween(
        this.player,
        { 'position.x': 100 + this.position * 175 },
        { duration: 0.22 },
      );
      this.tweens.add(this.motion);
      void this.syncState(true).catch((error: unknown) =>
        this.reportError(error),
      );
    }
    if (actions.wasPressed('routeCollect')) {
      if (this.position !== this.targets[this.count]) {
        this.panels.error.setVisible(true);
        this.root.focus.pushModal(this.panels.error);
        this.panels.play.setVisible(false);
        this.announce(
          'error',
          { target: (this.targets[this.count] ?? 0) + 1 },
          'assertive',
        );
      } else {
        this.count++;
        this.announce('progress', { count: this.count });
        if (this.count === 3) this.show('results');
        else
          void this.syncState(false).catch((error: unknown) =>
            this.reportError(error),
          );
      }
    }
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.releaseMotion?.();
    super.destroy();
  }
}

try {
  game = await Game.create({
    canvas: '#game',
    width: 1100,
    height: 1050,
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'canvas2d') as RendererPreference,
  });
  for (const [locale, table] of Object.entries(messages))
    game.i18n.addMessages(locale, table);
  game.i18n.setLocale(
    new URLSearchParams(location.search).get('locale') === 'zh-Hant'
      ? 'zh-Hant'
      : 'en',
  );
  scene = await Route.create(game);
  await game.setScene(scene);
  game.start();
  game.addEventListener('error', (event) => {
    const error = (event as CustomEvent<Error>).detail;
    const text = game!.i18n.t('fatal', { error: error.message });
    notice.textContent = text;
    game!.accessibility.announce(text, {
      priority: 'assertive',
      language: game!.i18n.locale,
    });
  });
  game.canvas.focus();
  scene.root.focus.move(1);
} catch (error) {
  const locale =
    new URLSearchParams(location.search).get('locale') === 'zh-Hant'
      ? 'zh-Hant'
      : 'en';
  notice.textContent = messages[locale].fatal.replace(
    '{error}',
    error instanceof Error ? error.message : String(error),
  );
  notice.setAttribute('role', 'alert');
  release();
}

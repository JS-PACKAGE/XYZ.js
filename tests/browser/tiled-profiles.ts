import { runTiledProfileSmoke } from '../tiled-profiles.browser.js';

const output = document.querySelector<HTMLPreElement>('#report')!;
const finish = document.querySelector<HTMLButtonElement>('#finish')!;
const backend =
  new URLSearchParams(location.search).get('renderer') ?? 'canvas2d';
const report: {
  backend: string;
  error?: string;
  scenarios: { name: string; metrics: unknown; png?: string }[];
} = { backend, scenarios: [] };
const publish = (state: string): void => {
  output.dataset.state = state;
  output.textContent = JSON.stringify(report, null, 2);
};
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

try {
  if (backend !== 'canvas2d' && backend !== 'webgl2' && backend !== 'webgpu')
    throw new Error('A forced supported renderer is required.');
  const smoke = await runTiledProfileSmoke(backend);
  const scene = smoke.scene;
  const initialCamera = scene.camera2D.position.x;
  const group = smoke.level.layers.get(10)!;
  const initialVisibility = group.visible;
  const plane = smoke.level.tileMaps.get(12)!.values().next().value!;
  assert(
    smoke.game.graphics.backend === backend,
    'Forced renderer silently changed.',
  );
  report.scenarios.push({
    name: 'infinite-import-native-animation-colliders',
    metrics: smoke.evidence,
    png: smoke.canvas.toDataURL('image/png'),
  });
  finish.disabled = false;
  publish('interactive');
  finish.addEventListener(
    'click',
    (event) => {
      try {
        assert(
          event.isTrusted,
          'Lifecycle completion requires a trusted click.',
        );
        assert(
          scene.camera2D.position.x === initialCamera + 8,
          'Camera control did not pan.',
        );
        assert(
          group.visible === initialVisibility,
          'Group visibility did not restore.',
        );
        assert(
          !plane.getTile(-2, -1).solid,
          'Trusted tile edit retained the solid tile.',
        );
        assert(
          smoke.game.state === 'paused',
          'Pause/resume did not return to paused state.',
        );
        const png = smoke.canvas.toDataURL('image/png');
        const parallaxX = smoke.level.layers.get(14)!.updateWorldMatrix()
          .elements[6];
        assert(
          parallaxX === 4,
          'Trusted camera pan did not update image parallax.',
        );
        smoke.dispose();
        assert(
          smoke.game.state === 'destroyed',
          'Game lifecycle did not retire.',
        );
        assert(
          !smoke.host.isConnected && smoke.level.asset.scope.destroyed,
          'Tiled ownership survived cleanup.',
        );
        report.scenarios.push({
          name: 'trusted-parallax-edit-cleanup',
          metrics: {
            parallaxX,
            scopeDestroyed: smoke.level.asset.scope.destroyed,
          },
          png,
        });
        finish.disabled = true;
        publish('passed');
      } catch (error) {
        smoke.dispose();
        report.error =
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error);
        publish('failed');
      }
    },
    { once: true },
  );
} catch (error) {
  report.error =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  publish('failed');
}

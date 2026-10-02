import {
  Game,
  Sprite,
  Text2D,
  Texture,
  FactoryRegistry,
  defineFactory,
  buildContentScene,
  type RendererPreference,
  type ResourceRequest,
  type ResourceScope,
  type ResourceLease,
  type ContentScene,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const status = $<HTMLParagraphElement>('status');
const stats = $<HTMLParagraphElement>('stats');
const leases = $<HTMLParagraphElement>('leases');
const controls = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button'),
);
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

interface Satellite {
  readonly scope: ResourceScope;
  readonly lease: ResourceLease<Texture>;
  readonly sprite: Sprite;
  failDetach: boolean;
}
interface BeaconOptions {
  x: number;
}
const parseBeacon = (value: unknown): BeaconOptions => {
  if (
    !value ||
    typeof value !== 'object' ||
    !('x' in value) ||
    typeof value.x !== 'number' ||
    !Number.isFinite(value.x) ||
    value.x < 100 ||
    value.x > 700
  ) {
    throw new TypeError('Beacon requires a finite x between 100 and 700.');
  }
  return { x: value.x };
};

let game: Game | undefined;
let monitor: number | undefined;
const lifetime = new AbortController();
const satellites: Satellite[] = [];
let busy = false;
const errorText = (error: unknown): string =>
  error instanceof AggregateError
    ? `${error.message} ${error.errors.map(errorText).join(' ')}`
    : error instanceof Error
      ? error.message
      : String(error);
const releaseSatellites = (): void => {
  const errors: unknown[] = [];
  for (const satellite of satellites) {
    try {
      satellite.scope.release();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length)
    throw new AggregateError(
      errors,
      'Satellite detach failed; retained leases can be retried.',
    );
};
const release = (): void => {
  lifetime.abort();
  clearInterval(monitor);
  // Retry deliberate one-shot detach failures before final owner destruction.
  const errors: unknown[] = [];
  try {
    releaseSatellites();
  } catch (error) {
    try {
      releaseSatellites();
    } catch (retryError) {
      errors.push(error, retryError);
    }
  }
  try {
    game?.destroy();
  } catch (error) {
    errors.push(error);
  }
  controls.forEach((button) => {
    button.disabled = true;
  });
  if (errors.length) throw new AggregateError(errors, 'Owner cleanup failed.');
};
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    try {
      release();
    } catch (error) {
      status.textContent = errorText(error);
    }
  }
});

try {
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: backend.value as RendererPreference,
  });
  lifetime.signal.throwIfAborted();
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const source = document.createElement('canvas');
  source.width = source.height = 128;
  const context = source.getContext('2d')!;
  context.strokeStyle = '#ffffff';
  context.lineWidth = 5;
  context.beginPath();
  context.arc(64, 64, 54, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    context.moveTo(64 + Math.cos(angle) * 36, 64 + Math.sin(angle) * 36);
    context.lineTo(64 + Math.cos(angle) * 48, 64 + Math.sin(angle) * 48);
  }
  context.stroke();
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(64, 64, 22, 0, Math.PI * 2);
  context.fill();

  let sharedLoads = 0;
  let sharedDisposals = 0;
  let candidateTextures = 0;
  let candidateDisposals = 0;
  let factories = 0;
  let publications = 0;
  let failFactory = false;
  let lastPublication = 'Initial candidate preparing';
  const sharedRequest: ResourceRequest<Texture> = {
    kind: 'texture',
    ownership: 'owned',
    async load(signal, ownership) {
      signal.throwIfAborted();
      const texture = ownership.own(await Texture.fromImage(source));
      sharedLoads++;
      signal.throwIfAborted();
      return texture;
    },
    dispose(texture) {
      texture.destroy();
      sharedDisposals++;
    },
  };
  class Beacon extends Sprite {
    readonly identity = ++factories;
    override update(dt: number): void {
      this.rotation += dt * 0.3;
    }
  }
  const registry = new FactoryRegistry({
    beacon: defineFactory<BeaconOptions, Beacon>({
      parse: parseBeacon,
      async create(options, context) {
        if (!context.resources)
          throw new Error('Candidate resource scope is required.');
        const texture = await Texture.fromImage(source);
        candidateTextures++;
        try {
          context.resources.own(texture, (owned) => {
            owned.destroy();
            candidateDisposals++;
          });
        } catch (error) {
          texture.destroy();
          candidateDisposals++;
          throw error;
        }
        const node = context.own(
          new Beacon({
            texture,
            position: [options.x, 245],
            scale: [1.35, 1.35],
            tint: [0.28, 0.94, 0.83, 1],
          }),
        );
        context.signal.throwIfAborted();
        if (failFactory) {
          failFactory = false;
          throw new Error(
            'Deliberate factory failure after claiming the fresh beacon and its texture.',
          );
        }
        return node;
      },
    }),
    satellite: defineFactory<BeaconOptions, Sprite>({
      parse: parseBeacon,
      async create(options, context) {
        const scope = context.resources;
        if (!scope) throw new Error('Satellite resource scope is required.');
        const lease = await scope.acquire(sharedRequest);
        const sprite = context.own(
          new Sprite({
            texture: lease.value,
            position: [options.x, 365],
            scale: [0.35, 0.35],
            tint: [1, 0.8, 0.3, 1],
          }),
        );
        const satellite: Satellite = {
          scope,
          lease,
          sprite,
          failDetach: false,
        };
        scope.attach(() => {
          if (satellite.failDetach) {
            satellite.failDetach = false;
            throw new Error(
              'Deliberate one-shot binding detach failure. Retry release; the lease remains held even after the node is detached.',
            );
          }
          sprite.destroy();
        });
        satellites.push(satellite);
        return sprite;
      },
    }),
    title: defineFactory<string, Text2D>({
      parse(value) {
        if (typeof value !== 'string' || value.length > 120)
          throw new TypeError('Title must be a short string.');
        return value;
      },
      async create(text, context) {
        const title = context.own(
          await Text2D.create(text, { fontSize: 25, color: '#d9edff' }),
        );
        title.position.set(400, 65);
        return title;
      },
    }),
  });
  const loader = await runtime.createContentLoader(registry, undefined);
  let active: ContentScene<typeof registry.definitions> =
    await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [
          { id: 'beacon', kind: 'beacon', options: { x: 400 } },
          {
            id: 'title',
            kind: 'title',
            options: 'FRESH WORLDS · OWNED LIFETIMES',
          },
        ],
      },
      undefined,
      { resourcePool: runtime.resources, signal: lifetime.signal },
    );
  await runtime.setScene(active.scene, { signal: lifetime.signal });
  publications++;
  lastPublication = `Published beacon #${active.require('beacon', 'beacon').identity}`;
  runtime.start();
  await loader.save(runtime.saves, 'active', active);

  const refresh = (): void => {
    const beacon = active.require('beacon', 'beacon');
    const frame = runtime.graphics.stats;
    stats.textContent = `${runtime.graphics.backend} · ${runtime.state} · active beacon #${beacon.identity}, x=${beacon.position.x.toFixed(0)} · published ${publications} · candidate textures created/disposed ${candidateTextures}/${candidateDisposals} · shared textures loaded/disposed ${sharedLoads}/${sharedDisposals} · frame ${frame.frame}, 2D draws ${frame.drawCalls2D} · ${lastPublication}`;
    const live = satellites.filter((satellite) => !satellite.lease.released);
    const same =
      live.length > 1
        ? live.every(
            (satellite) => satellite.lease.value === live[0]!.lease.value,
          )
        : null;
    leases.textContent = `Shared leases active/released ${live.length}/${satellites.length - live.length} · same Texture identity ${same ?? 'acquire two to compare'} · ${satellites.map((satellite, index) => `#${index + 1}: lease ${satellite.lease.released ? 'released' : 'held'}, scope ${satellite.scope.destroyed ? 'closed' : 'open'}, consumer ${satellite.sprite.destroyed ? 'detached' : 'visible'}`).join(' | ') || 'No satellites yet'}`;
  };
  const run = (id: string, action: () => void | Promise<void>): void => {
    $<HTMLButtonElement>(id).addEventListener('click', () => {
      if (busy || runtime.state === 'destroyed') return;
      busy = true;
      controls.forEach((button) => {
        button.disabled = true;
      });
      void Promise.resolve()
        .then(action)
        .catch((error: unknown) => {
          status.textContent = errorText(error);
        })
        .finally(() => {
          busy = false;
          if (runtime.state !== 'destroyed') {
            controls.forEach((button) => {
              button.disabled = false;
            });
            refresh();
          }
        });
    });
  };
  run('acquire', async () => {
    if (satellites.filter((satellite) => !satellite.lease.released).length >= 8)
      throw new Error(
        'Release a satellite before acquiring more (eight visible slots).',
      );
    await active.spawn(
      {
        id: `satellite-${satellites.length + 1}`,
        kind: 'satellite',
        options: { x: 100 + (satellites.length % 8) * 85 },
      },
      { signal: lifetime.signal },
    );
    status.textContent =
      'Acquired an authored satellite with a separate scope lease. Repeated acquisitions share one texture until the last release.';
  });
  run('release-one', () => {
    const satellite = satellites.find((entry) => !entry.lease.released);
    if (!satellite)
      throw new Error('No held satellite lease. Acquire one first.');
    satellite.scope.release();
    status.textContent =
      'One scope released: its consumer detached before its lease. Last borrower disposal is reflected above.';
  });
  run('release-all', () => {
    releaseSatellites();
    status.textContent =
      'All satellite scopes released. Acquire again to perform a fresh shared load.';
  });
  run('hold-detach', () => {
    const satellite = satellites.find(
      (entry) => !entry.lease.released && !entry.sprite.destroyed,
    );
    if (!satellite) throw new Error('Acquire a satellite first.');
    satellite.failDetach = true;
    status.textContent =
      'One real consumer callback will fail its next detach. Release one, then retry: disposal must wait for detachment.';
  });
  run('move', () => {
    const beacon = active.require('beacon', 'beacon');
    beacon.position.x = beacon.position.x > 450 ? 280 : 560;
    beacon.tint =
      beacon.position.x > 450 ? [1, 0.47, 0.65, 1] : [0.28, 0.94, 0.83, 1];
    status.textContent =
      'Changed the live beacon position and tint. Load restores saved state into a new candidate, not this live object.';
  });
  run('save', async () => {
    await loader.save(runtime.saves, 'active', active);
    status.textContent =
      'Captured active content topology and state into the in-memory active slot.';
  });
  const loadFresh = async (): Promise<void> => {
    const previous = active;
    satellites.forEach((satellite) => {
      satellite.failDetach = false;
    });
    const result = await loader.load(runtime.saves, 'active', {
      signal: lifetime.signal,
    });
    if (result.status !== 'loaded')
      throw new Error(`Save result: ${result.status}`);
    active = result.content;
    publications++;
    lastPublication = `Old scene destroyed ${previous.scene.destroyed}; old resource scope closed ${previous.resources?.destroyed ?? false}`;
    status.textContent = `Published fresh beacon #${active.require('beacon', 'beacon').identity}. ${lastPublication}.`;
  };
  run('load', loadFresh);
  const rejectLoad = async (factoryFailure: boolean): Promise<void> => {
    const previous = active;
    const beacon = previous.require('beacon', 'beacon');
    const oldX = beacon.position.x;
    if (!factoryFailure)
      await runtime.saves.save('invalid', { version: 99, content: null });
    failFactory = factoryFailure;
    try {
      const result = await loader.load(
        runtime.saves,
        factoryFailure ? 'active' : 'invalid',
        { signal: lifetime.signal },
      );
      if (result.status === 'loaded') {
        active = result.content;
        publications++;
        throw new Error(
          'Unexpected publication: rejection scenario did not reject.',
        );
      }
      status.textContent = `Rejected with save status ${result.status}; active scene unchanged ${runtime.scene === previous.scene}.`;
    } catch (error) {
      const retained =
        runtime.scene === previous.scene &&
        !previous.scene.destroyed &&
        beacon.position.x === oldX;
      status.textContent = `${errorText(error)} Active scene and position unchanged: ${retained}; beacon #${beacon.identity}. Load fresh retries with a healthy factory.`;
      if (!retained)
        throw new Error('Rejected candidate did not retain the active scene.', {
          cause: error,
        });
    } finally {
      failFactory = false;
    }
  };
  run('invalid', () => rejectLoad(false));
  run('factory-fail', () => rejectLoad(true));
  run('destroy', () => {
    loader.destroy();
    release();
    stats.textContent = `${runtime.graphics.backend} · destroyed · candidate textures created/disposed ${candidateTextures}/${candidateDisposals} · shared textures loaded/disposed ${sharedLoads}/${sharedDisposals} · all leases released ${satellites.every((satellite) => satellite.lease.released)}`;
    leases.textContent = 'All owned consumers and resources released.';
    status.textContent = 'Destroyed the owner. Reload to start again.';
  });
  controls.forEach((button) => {
    button.disabled = false;
  });
  refresh();
  monitor = setInterval(refresh, 250);
  status.textContent =
    'Ready. Initial scene is already saved. Acquire two satellites to compare shared texture identity.';
} catch (error) {
  status.textContent = errorText(error);
  try {
    release();
  } catch (cleanupError) {
    status.textContent += ` · Cleanup: ${errorText(cleanupError)}`;
  }
}

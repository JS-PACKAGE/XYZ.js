type Tag = '2D' | '3D' | 'Audio' | 'Input' | 'Assets' | 'Data' | 'Benchmark';
type Renderer = 'auto' | 'webgpu' | 'webgl2' | 'canvas2d';

interface Example {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly Tag[];
  /** Backends selectable through `?renderer=`; empty when the page fixes or hides the choice. */
  readonly renderers: readonly Renderer[];
}

const all2d: readonly Renderer[] = ['auto', 'webgpu', 'webgl2', 'canvas2d'];
const only3d: readonly Renderer[] = ['auto', 'webgpu', 'webgl2'];

const examples: readonly Example[] = [
  {
    slug: 'beacon-run',
    title: 'Beacon Run',
    summary:
      'Playable 3D mission with native skin/mips, capsule physics, dynamic crates, navigation, canvas UI, sound and saved progress.',
    tags: ['3D', 'Input', 'Audio', 'Data'],
    renderers: only3d,
  },
  {
    slug: 'triangle',
    title: 'Triangle',
    summary: 'The smallest WebGPU frame with Pause, Resume and Destroy.',
    tags: ['2D'],
    renderers: [],
  },
  {
    slug: 'sprite',
    title: 'Sprite & audio',
    summary:
      'Shared textures, z-order, opacity and six-voice OPM music plus SFX.',
    tags: ['2D', 'Audio'],
    renderers: [],
  },
  {
    slug: 'pong',
    title: 'Pong',
    summary:
      'Camera2D, keyboard, pointer and gamepad input, scoring and scene restart.',
    tags: ['2D', 'Input'],
    renderers: [],
  },
  {
    slug: 'cube3d',
    title: 'Cube 3D',
    summary: 'Textured, lit cube and sphere with depth and a 2D overlay.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'fallback-demo',
    title: 'Backend fallback',
    summary: 'Pick a backend and inspect its capabilities with the same scene.',
    tags: ['2D', '3D'],
    renderers: all2d,
  },
  {
    slug: 'showcase',
    title: 'Showcase',
    summary: 'One scene mixing 2D, 3D and audio, with scene switching.',
    tags: ['2D', '3D', 'Audio'],
    renderers: all2d,
  },
  {
    slug: 'advanced3d',
    title: 'Advanced 3D',
    summary:
      'Hierarchy, orbit controls, picking, glTF skin, PBR, shadows, HDR bloom and instancing.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'gameplay2d',
    title: '2D gameplay',
    summary:
      'Animation, text, HUD, actions, camera, physics, maps, particles, preload, audio and transitions.',
    tags: ['2D', 'Input', 'Audio'],
    renderers: all2d,
  },
  {
    slug: 'rendering2d',
    title: 'Retained 2D rendering',
    summary:
      'Atlases, vector paths, masks, blends, filters, meshes and text assets.',
    tags: ['2D'],
    renderers: all2d,
  },
  {
    slug: 'physics2d',
    title: 'Physics',
    summary:
      'Bodies with different shapes and materials, click-to-spawn and gravity control.',
    tags: ['2D'],
    renderers: all2d,
  },
  {
    slug: 'physics2d-lab',
    title: 'Physics lab',
    summary:
      'Joints, mouse dragging, concave cup, chain room, CCD bullet, sleeping and a debug overlay.',
    tags: ['2D'],
    renderers: all2d,
  },
  {
    slug: 'animation-lab',
    title: 'Animation lab',
    summary:
      'Animation state machine with cross-fades, plus Tween and Timeline.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'objects3d',
    title: '3D objects',
    summary: 'LOD, camera-facing Billboard, Text3D labels and Line3D ribbons.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'shadows3d',
    title: 'Shadow atlas',
    summary:
      'Point six-face shadows, spot shadows and camera-fitted directional cascades.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'particles2d',
    title: 'Particles',
    summary: 'Selectable emitter presets with live parameters and counts.',
    tags: ['2D'],
    renderers: all2d,
  },
  {
    slug: 'tilemap2d',
    title: 'Tile map & camera',
    summary:
      'Scrollable tile map, tile collision, camera follow, shake and zoom.',
    tags: ['2D', 'Input'],
    renderers: all2d,
  },
  {
    slug: 'transitions2d',
    title: 'Scene transitions',
    summary: 'Every whole-frame transition between several scenes.',
    tags: ['2D'],
    renderers: all2d,
  },
  {
    slug: 'ui2d',
    title: 'UI & text',
    summary:
      'Text2D, bitmap fonts, nine-slice panels, HUD and interactive buttons.',
    tags: ['2D', 'Input'],
    renderers: all2d,
  },
  {
    slug: 'input-lab',
    title: 'Input lab',
    summary:
      'Live keyboard, pointer and gamepad state plus a remappable action map.',
    tags: ['2D', 'Input'],
    renderers: all2d,
  },
  {
    slug: 'save-lab',
    title: 'Save lab',
    summary:
      'Named save slots in localStorage or IndexedDB, scene snapshots and reload restore.',
    tags: ['2D', 'Data'],
    renderers: all2d,
  },
  {
    slug: 'audio-lab',
    title: 'Audio lab',
    summary:
      'Gesture unlock, OPM music and SFX, PCM samples, volumes and preload progress.',
    tags: ['2D', 'Audio', 'Assets'],
    renderers: all2d,
  },
  {
    slug: 'pbr3d',
    title: 'PBR & shadows',
    summary:
      'Metalness and roughness grid with lights, shadows, fog, exposure and bloom.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'instancing3d',
    title: 'Instancing',
    summary:
      'Thousands of animated InstancedMesh instances beside culled ordinary meshes, with render stats.',
    tags: ['3D', 'Benchmark'],
    renderers: only3d,
  },
  {
    slug: 'picking3d',
    title: 'Hierarchy & picking',
    summary:
      'Nested groups, orbit controls, ray picking and camera projection switch.',
    tags: ['3D', 'Input'],
    renderers: only3d,
  },
  {
    slug: 'gltf3d',
    title: 'glTF & morph targets',
    summary: 'Skinned glTF animation playback and morph-target weights.',
    tags: ['3D', 'Assets'],
    renderers: only3d,
  },
  {
    slug: 'authoring-lab',
    title: 'Authoring & device flow',
    summary:
      'Canvas UI layout, focus and widgets, cross-device contexts, budgeted residency/warm-up and typed JSON scene factories.',
    tags: ['2D', 'Input', 'Assets', 'Data'],
    renderers: all2d,
  },
  {
    slug: 'lightweight2d',
    title: 'Lightweight 2D startup',
    summary:
      'Animated 2D scene, pause and cleanup, render stats and honest lazy-service initialization flags.',
    tags: ['2D', 'Benchmark'],
    renderers: all2d,
  },
  {
    slug: 'resource-lifecycle',
    title: 'Resource scopes & safe publication',
    summary:
      'Shared asset leases, owned releases and fresh save/content candidates that preserve the active scene on rejected loads.',
    tags: ['2D', 'Assets', 'Data'],
    renderers: all2d,
  },
  {
    slug: 'character-platforms',
    title: 'Character & moving platforms',
    summary:
      'Walk, jump and crouch on moving and rotating supports, with ceiling-blocked standing and live support state.',
    tags: ['3D', 'Input'],
    renderers: only3d,
  },
  {
    slug: 'joints3d',
    title: '3D constraints & hinge motor',
    summary:
      'Real distance, hinge and ball-socket constraints, a suspended rig, motor controls and live constraint metrics.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'ccd3d',
    title: 'Dynamic & rotational CCD',
    summary:
      'Fire fast dynamic bodies and rotate collision geometry, compare continuous collision and inspect real solver counters.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'navigation-bake',
    title: 'Multilayer navigation & shared budget',
    summary:
      'Bake bridge and underpass surfaces, route 120 capsules via real stairs and bound their shared navigation work.',
    tags: ['3D', 'Benchmark'],
    renderers: only3d,
  },
  {
    slug: 'text-i18n',
    title: 'Bidi & grapheme text editing',
    summary:
      'Engine-rendered RTL, CJK and emoji editing with native text input, visual selection and grapheme-aware carets.',
    tags: ['2D', 'Input'],
    renderers: all2d,
  },
  {
    slug: 'audio-effects',
    title: 'Audio effects & spatial bindings',
    summary:
      'Trusted audio unlock, native bus effects, overlapping ducking, automation and a scene-bound moving emitter.',
    tags: ['2D', 'Audio'],
    renderers: all2d,
  },
  {
    slug: 'motion2d',
    title: '2D character & continuous motion',
    summary:
      'Swept kinematic movement, slopes and stairs, moving supports and dynamic/rotational CCD.',
    tags: ['2D', 'Input'],
    renderers: all2d,
  },
  {
    slug: 'locomotion3d',
    title: 'Fixed-step animated locomotion',
    summary:
      'Animation-driven capsule motion with gravity, jumping, collision and moving-platform support.',
    tags: ['3D', 'Input'],
    renderers: only3d,
  },
  {
    slug: 'world-visibility',
    title: 'World visibility & HLOD',
    summary:
      'Conservative native occlusion, screen-size coverage fades, HLOD replacement and visible instance packing.',
    tags: ['3D', 'Benchmark'],
    renderers: only3d,
  },
  {
    slug: 'native-material3d',
    title: 'Native shaders & local lights',
    summary:
      'Per-mesh WGSL/GLSL deformation and textures with bounded camera/mesh-aware local-light selection.',
    tags: ['3D'],
    renderers: only3d,
  },
  {
    slug: 'world-streaming',
    title: 'Owned world streaming',
    summary:
      'Fetched shared terrain assets, prefetched cells, atomic colliders and revision-safe navigation seams.',
    tags: ['3D', 'Assets', 'Data'],
    renderers: only3d,
  },
  {
    slug: 'cpu-workers',
    title: 'Native CPU workers',
    summary:
      'Real worker terrain processing, transfer/copy accounting, responsive heartbeats and hard cancellation.',
    tags: ['3D', 'Assets', 'Benchmark'],
    renderers: only3d,
  },
  {
    slug: 'tiled-import',
    title: 'Tiled level import',
    summary:
      'Orthogonal external tilesets, flipped GIDs, typed content and live owned tile/object colliders.',
    tags: ['2D', 'Assets'],
    renderers: all2d,
  },
  {
    slug: 'gpu-particles3d',
    title: 'GPU 3D particles',
    summary:
      'Seeded native analytic particles with local/world birth space, capacity policies and explicit teardown.',
    tags: ['3D', 'Benchmark'],
    renderers: ['webgpu', 'webgl2'],
  },
  {
    slug: 'accessibility-game',
    title: 'Accessible game flow',
    summary:
      'Playable keyboard-only route, settings, remapping, modal focus and reduced-motion/contrast preferences.',
    tags: ['2D', 'Input', 'Data'],
    renderers: all2d,
  },
  {
    slug: 'asset-recipe',
    title: 'Asset recipe source',
    summary:
      'Run the authored glTF recipe fixture through the public loader, native rendering and deterministic cleanup.',
    tags: ['3D', 'Assets'],
    renderers: only3d,
  },
];

const filters = document.querySelector<HTMLFieldSetElement>('#filters')!;
const grid = document.querySelector<HTMLUListElement>('#grid')!;
const examplesURL = new URL(grid.dataset.examplesBase!, document.baseURI);

function card(example: Example): HTMLLIElement {
  const item = document.createElement('li');
  item.dataset.tags = example.tags.join(' ');

  const heading = document.createElement('h2');
  const link = document.createElement('a');
  link.href = new URL(`${example.slug}/`, examplesURL).href;
  link.textContent = example.title;
  heading.append(link);

  const summary = document.createElement('p');
  summary.textContent = example.summary;

  const tags = document.createElement('div');
  tags.className = 'tags';
  for (const tag of example.tags) {
    const chip = document.createElement('span');
    chip.textContent = tag;
    tags.append(chip);
  }
  item.append(heading, summary, tags);

  if (example.renderers.length > 0) {
    const backends = document.createElement('div');
    backends.className = 'backends';
    backends.append('Backend:');
    for (const renderer of example.renderers) {
      const backend = document.createElement('a');
      backend.href = new URL(
        `${example.slug}/?renderer=${renderer}`,
        examplesURL,
      ).href;
      backend.textContent = renderer;
      backends.append(backend);
    }
    item.append(backends);
  }
  return item;
}

const tagNames = ['All', ...new Set(examples.flatMap((e) => e.tags))];
for (const [index, name] of tagNames.entries()) {
  const label = document.createElement('label');
  label.className = 'chip';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'tag';
  radio.value = name;
  radio.checked = index === 0;
  label.append(radio, name);
  filters.append(label);
}

function render(tag: string): void {
  grid.replaceChildren(
    ...examples
      .filter((example) => tag === 'All' || example.tags.includes(tag as Tag))
      .map(card),
  );
}

filters.addEventListener('change', (event) => {
  render((event.target as HTMLInputElement).value);
});
render('All');

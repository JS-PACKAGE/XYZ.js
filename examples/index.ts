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
];

const filters = document.querySelector<HTMLFieldSetElement>('#filters')!;
const grid = document.querySelector<HTMLUListElement>('#grid')!;

function card(example: Example): HTMLLIElement {
  const item = document.createElement('li');
  item.dataset.tags = example.tags.join(' ');

  const heading = document.createElement('h2');
  const link = document.createElement('a');
  link.href = `./${example.slug}/`;
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
      backend.href = `./${example.slug}/?renderer=${renderer}`;
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

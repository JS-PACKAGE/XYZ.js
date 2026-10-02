import {
  Group2D,
  Scene,
  Sprite,
  Vector2,
  type Texture,
  type Rect2D,
  type SpriteOptions,
  type TimerHandle,
} from '../../src/index.js';

// Published v1.12.1 call sites, compiled against both frozen and current declarations.
export function createPlayer(texture: Texture, scene: Scene): Sprite {
  const options: SpriteOptions = {
    texture,
    position: [12, 18],
    anchor: [0.5, 1],
    sampler: { minFilter: 'nearest', magFilter: 'linear' },
    space: 'world',
    tint: [1, 0.5, 0.25, 1],
  };
  const group: Group2D = scene.add(new Group2D());
  const player: Sprite = group.add(new Sprite(options));
  player.position = new Vector2(24, 32);
  player.addEventListener(
    'pointertap',
    (event: Event) => event.preventDefault(),
    { once: true },
  );
  const bounds: Rect2D = player.getWorldBounds();
  player.toLocal(new Vector2(bounds.x, bounds.y), new Vector2());
  const timer: TimerHandle = scene.timers.after(1, () => player.destroy());
  timer.cancel();
  return player;
}

export class Level2D extends Scene {
  override update(deltaTime: number): void {
    this.camera2D.zoom = Math.max(1, deltaTime);
  }
  protected override onDestroy(): void {}
}

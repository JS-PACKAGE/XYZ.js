import { Scene, Sprite, type Texture, type ColorRGBA } from 'xyz.js';
import {
  boot,
  validCheckpoint,
  type Arena,
  type Checkpoint,
  type Controls,
  type Events,
  type Outcome,
} from './flow.js';
const crystals = [
  [130, 100],
  [340, 110],
  [710, 100],
  [100, 390],
  [450, 420],
] as const;
const walls = [
  [400, 10, 800, 20],
  [400, 470, 800, 20],
  [10, 240, 20, 480],
  [790, 240, 20, 480],
  [240, 180, 24, 220],
  [440, 330, 240, 24],
  [600, 160, 24, 160],
] as const;
class Courier extends Scene implements Arena {
  private readonly player: Sprite;
  private readonly gems: Sprite[] = [];
  private readonly patrols: Sprite[] = [];
  private readonly gate: Sprite;
  private collected = Array<boolean>(5).fill(false);
  private remaining = 90;
  private outcome: Outcome = 'playing';
  private hudSecond = -1;
  constructor(
    texture: Texture,
    private readonly controls: Controls,
    private readonly events: Events,
  ) {
    super();
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      tint: ColorRGBA,
    ): Sprite =>
      this.add(
        new Sprite({
          texture,
          position: [x, y],
          scale: [w, h],
          anchor: [0.5, 0.5],
          tint,
        }),
      );
    rect(400, 240, 800, 480, [0.07, 0.11, 0.18, 1]);
    for (const [x, y, w, h] of walls) rect(x, y, w, h, [0.32, 0.4, 0.55, 1]);
    this.gate = rect(710, 420, 46, 46, [0.16, 0.45, 0.25, 1]);
    for (const [x, y] of crystals) {
      const gem = rect(x, y, 20, 20, [0.2, 0.95, 1, 1]);
      gem.rotation = Math.PI / 4;
      this.gems.push(gem);
    }
    this.patrols.push(
      rect(400, 210, 32, 32, [1, 0.24, 0.28, 1]),
      rect(680, 300, 32, 32, [1, 0.24, 0.28, 1]),
    );
    this.player = rect(60, 420, 24, 24, [1, 0.86, 0.3, 1]);
  }
  reset(): void {
    this.restore({
      position: [60, 420, 0],
      collected: Array<boolean>(5).fill(false),
      remaining: 90,
      outcome: 'playing',
    });
  }
  valid(value: unknown): value is Checkpoint {
    if (!validCheckpoint(value, '2d')) return false;
    return !this.blocked(value.position[0]!, value.position[1]!);
  }
  restore(checkpoint: Checkpoint): void {
    if (!this.valid(checkpoint))
      throw new Error(
        'Checkpoint player intersects a wall or lies outside the arena.',
      );
    this.player.position.set(checkpoint.position[0]!, checkpoint.position[1]!);
    this.collected = [...checkpoint.collected];
    this.remaining = checkpoint.remaining;
    this.outcome = checkpoint.outcome;
    this.gems.forEach((gem, index) => {
      gem.visible = !this.collected[index];
    });
    this.hudSecond = -1;
    this.refresh();
  }
  snapshot(): Checkpoint {
    return {
      position: [this.player.position.x, this.player.position.y, 0],
      collected: [...this.collected],
      remaining: this.remaining,
      outcome: this.outcome,
    };
  }
  private blocked(x: number, y: number): boolean {
    return walls.some(
      ([wx, wy, w, h]) =>
        Math.abs(x - wx) < w / 2 + 12 && Math.abs(y - wy) < h / 2 + 12,
    );
  }
  private refresh(): void {
    const count = this.collected.filter(Boolean).length;
    this.gate.tint = count === 5 ? [0.25, 1, 0.45, 1] : [0.16, 0.45, 0.25, 1];
    this.events.hud(count, this.remaining);
  }
  override update(delta: number): void {
    if (this.outcome !== 'playing') return;
    const dt = Math.min(delta, 0.03);
    this.remaining = Math.max(0, this.remaining - dt);
    let dx =
      Number(this.controls.down('right')) - Number(this.controls.down('left'));
    let dy =
      Number(this.controls.down('down')) - Number(this.controls.down('up'));
    const length = Math.max(1, Math.hypot(dx, dy));
    dx = (dx / length) * dt * 180;
    dy = (dy / length) * dt * 180;
    const p = this.player.position;
    if (!this.blocked(p.x + dx, p.y)) p.x += dx;
    if (!this.blocked(p.x, p.y + dy)) p.y += dy;
    const elapsed = 90 - this.remaining;
    this.patrols[0]!.position.x = 400 + Math.sin(elapsed * 1.2) * 80;
    this.patrols[1]!.position.y = 300 + Math.sin(elapsed * 1.4) * 60;
    for (let i = 0; i < this.gems.length; i++) {
      const gem = this.gems[i]!;
      if (
        !this.collected[i] &&
        Math.hypot(p.x - gem.position.x, p.y - gem.position.y) < 27
      ) {
        this.collected[i] = true;
        gem.visible = false;
        this.refresh();
        this.events.collect();
      }
    }
    if (
      this.patrols.some(
        (patrol) =>
          Math.abs(p.x - patrol.position.x) < 28 &&
          Math.abs(p.y - patrol.position.y) < 28,
      ) ||
      this.remaining === 0
    )
      this.outcome = 'lost';
    else if (
      this.collected.every(Boolean) &&
      Math.hypot(p.x - 710, p.y - 420) < 30
    )
      this.outcome = 'won';
    if (Math.ceil(this.remaining) !== this.hudSecond) {
      this.hudSecond = Math.ceil(this.remaining);
      this.refresh();
    }
    if (this.outcome !== 'playing') this.events.finish(this.outcome);
  }
}
void boot(
  '2d',
  (texture, controls, events) => new Courier(texture, controls, events),
);

import { Game, Scene, Sprite, Texture, Vector2 } from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
let game: Game | undefined;
let texture: Texture | undefined;
try {
  game = await Game.create({ canvas: '#game', width: 800, height: 450 });
  const source = document.createElement('canvas');
  source.width = source.height = 1;
  const context = source.getContext('2d')!;
  context.fillStyle = '#d9edff';
  context.fillRect(0, 0, 1, 1);
  texture = await Texture.fromImage(source);
  const runtime = game;
  const white = texture;
  class Pong extends Scene {
    readonly left = this.add(
      new Sprite({ texture: white, position: [30, 225], scale: [12, 80] }),
    );
    readonly right = this.add(
      new Sprite({ texture: white, position: [770, 225], scale: [12, 80] }),
    );
    readonly ball = this.add(
      new Sprite({ texture: white, position: [400, 225], scale: [14, 14] }),
    );
    readonly paddles = [this.left, this.right];
    readonly velocity = new Vector2(280, 140);
    readonly pointerWorld = new Vector2();
    score = [0, 0];
    private scoreDirty = true;
    override update(dt: number): void {
      this.camera2D.zoom = Math.min(runtime.width / 800, runtime.height / 450);
      this.camera2D.position.set(
        (800 - runtime.width / this.camera2D.zoom) / 2,
        (450 - runtime.height / this.camera2D.zoom) / 2,
      );
      const input = runtime.input;
      const axis =
        (input.keyboard.isDown('ArrowDown') ? 1 : 0) -
        (input.keyboard.isDown('ArrowUp') ? 1 : 0);
      this.left.position.y +=
        (axis || input.gamepads[0]?.axes[1] || 0) * 340 * dt;
      if (input.pointer.isDown(0)) {
        this.camera2D.screenToWorld(input.pointer.position, this.pointerWorld);
        this.left.position.y = this.pointerWorld.y;
      }
      this.left.position.y = Math.max(40, Math.min(410, this.left.position.y));
      this.right.position.y += Math.max(
        -230 * dt,
        Math.min(230 * dt, this.ball.position.y - this.right.position.y),
      );
      this.right.position.y = Math.max(
        40,
        Math.min(410, this.right.position.y),
      );
      this.ball.position.x += this.velocity.x * dt;
      this.ball.position.y += this.velocity.y * dt;
      if (this.ball.position.y < 7 || this.ball.position.y > 443) {
        this.ball.position.y = Math.max(7, Math.min(443, this.ball.position.y));
        this.velocity.y *= -1;
      }
      for (const paddle of this.paddles) {
        const approaching =
          paddle === this.left ? this.velocity.x < 0 : this.velocity.x > 0;
        if (
          approaching &&
          Math.abs(this.ball.position.x - paddle.position.x) < 13 &&
          Math.abs(this.ball.position.y - paddle.position.y) < 47
        ) {
          this.ball.position.x =
            paddle.position.x + (paddle === this.left ? 13 : -13);
          this.velocity.x *= -1;
          this.velocity.y = (this.ball.position.y - paddle.position.y) * 5;
        }
      }
      if (this.ball.position.x < -7 || this.ball.position.x > 807) {
        this.score[this.ball.position.x < 0 ? 1 : 0]!++;
        this.scoreDirty = true;
        this.ball.position.set(400, 225);
        this.velocity.set(-this.velocity.x, 140);
      }
      if (this.scoreDirty) {
        status.textContent = `${this.score[0]} : ${this.score[1]} · Arrow keys / drag / gamepad · ${runtime.graphics.backend}`;
        this.scoreDirty = false;
      }
    }
  }
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  await game.setScene(new Pong());
  game.start();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      game?.destroy();
      texture?.destroy();
    }
  });
} catch (error) {
  game?.destroy();
  texture?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

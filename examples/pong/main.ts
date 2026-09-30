import {
  Game,
  Scene,
  Sprite,
  Texture,
  Text2D,
  Vector2,
} from '../../src/index.js';

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
  const reportError = (error: unknown): void => {
    runtime.pause();
    status.textContent = error instanceof Error ? error.message : String(error);
  };
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
    private scoreboard: Text2D | undefined;
    private serving = true;
    protected override async initialize(
      _game: Game,
      signal: AbortSignal,
    ): Promise<void> {
      const label = await Text2D.create('0 : 0\nGet ready', { fontSize: 28 });
      if (signal.aborted) {
        label.destroy();
        signal.throwIfAborted();
      }
      label.position.set(400, 48);
      label.zIndex = 1;
      this.scoreboard = this.add(label);
      this.serve(280);
    }
    private showScore(): void {
      const text = `${this.score[0]} : ${this.score[1]}${this.serving ? '\nGet ready' : ''}`;
      status.textContent = `${this.score[0]} : ${this.score[1]} · ${this.serving ? 'Serving in one simulation second' : 'Playing'} · ${runtime.graphics.backend}`;
      void this.scoreboard?.setText(text).catch(reportError);
    }
    private serve(speed: number): void {
      this.serving = true;
      this.ball.position.set(400, 225);
      this.velocity.set(0, 0);
      this.showScore();
      this.timers.after(1, () => {
        this.serving = false;
        this.velocity.set(speed, 140);
        this.showScore();
      });
    }
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
        this.serve(-this.velocity.x);
      }
    }
  }
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  await game.setScene(new Pong());
  game.start();
  document.querySelector('#pause')!.addEventListener('click', (event) => {
    if (runtime.state === 'running') runtime.pause();
    else if (runtime.state === 'paused') runtime.resume();
    (event.currentTarget as HTMLButtonElement).textContent =
      runtime.state === 'paused' ? 'Resume' : 'Pause';
  });
  document
    .querySelector('#restart')!
    .addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      button.disabled = true;
      try {
        await runtime.setScene(new Pong());
      } catch (error) {
        reportError(error);
      } finally {
        button.disabled = false;
      }
    });
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

import {
  Game,
  Scene,
  Primitive2D,
  Tween,
  SaveManager,
  assertJsonValue,
  CutsceneDirector,
  cutsceneTween,
  Dialogue,
  QuestSystem,
  type DialogueState,
  type QuestState,
  type RendererPreference,
} from '../../src/index.js';

const status = document.querySelector<HTMLElement>('#status')!;
const text = document.querySelector<HTMLElement>('#dialogue')!;
const choices = document.querySelector<HTMLElement>('#choices')!;
const courier = document.querySelector<HTMLElement>('#courier')!;
const error = document.querySelector<HTMLElement>('#error')!;
const saves = new SaveManager();
let coins = 0;
let finishChoice: (() => void) | undefined;
const game = await Game.create({
  canvas: '#game',
  width: 320,
  height: 80,
  renderer: (new URLSearchParams(location.search).get('renderer') ??
    'auto') as RendererPreference,
});
class Story extends Scene {
  protected override async initialize(
    _game: Game,
    signal: AbortSignal,
  ): Promise<void> {
    const route = await Primitive2D.rectangle(800, 8, '#526d91');
    route.position.set(220, 65);
    this.add(route);
    const marker = await Primitive2D.rectangle(16, 24, '#ffd070');
    marker.position.set(40, 45);
    this.add(marker);
    for (const x of [140, 220]) {
      const parcel = await Primitive2D.rectangle(10, 10, '#9ce5cb');
      parcel.position.set(x, 55);
      this.add(parcel);
    }
    signal.throwIfAborted();
  }
  readonly quests = this.add(
    new QuestSystem(
      [
        {
          id: 'delivery',
          objectives: [{ id: 'parcel', target: 2 }],
          rewards: ['coin'],
        },
        {
          id: 'return',
          prerequisites: ['delivery'],
          objectives: [{ id: 'home', target: 1 }],
          rewards: ['coin'],
        },
      ],
      {
        onReward: (rewards) => {
          coins += rewards.length;
        },
      },
    ),
  );
  readonly dialogue = this.add(
    new Dialogue(
      {
        id: 'courier',
        start: 'offer',
        nodes: [
          {
            id: 'offer',
            text: 'Will you help deliver my parcels?',
            choices: [
              {
                id: 'accept',
                text: 'Accept the delivery',
                next: 'accepted',
                events: ['accept'],
              },
              { id: 'decline', text: 'Not today', next: 'declined' },
            ],
          },
          {
            id: 'accepted',
            text: 'Thank you! Deliver two parcels.',
            events: ['finish'],
          },
          {
            id: 'declined',
            text: 'You can still enjoy the camera tour.',
            events: ['finish'],
          },
        ],
      },
      {
        onEvent: (event) => {
          if (event === 'accept') this.quests.accept('delivery');
          if (event === 'finish') {
            finishChoice?.();
            finishChoice = undefined;
          }
        },
      },
    ),
  );
  readonly director = this.add(
    new CutsceneDirector({
      duration: 6,
      tracks: [
        {
          id: 'camera',
          start: 0,
          duration: 6,
          action: cutsceneTween(
            Tween.to(
              this.camera2D,
              { 'position.x': 220 },
              { duration: 6, easing: 'linear' },
            ),
          ),
        },
      ],
      cues: [
        {
          id: 'conversation',
          at: 2,
          run: ({ signal }) => {
            this.dialogue.start();
            return new Promise<void>((resolve) => {
              finishChoice = resolve;
              signal.addEventListener(
                'abort',
                () => {
                  finishChoice = undefined;
                  choices.replaceChildren();
                },
                { once: true },
              );
            });
          },
        },
      ],
    }),
  );
  override update(): void {
    courier.style.transform = `translateX(${this.camera2D.position.x}px)`;
    status.textContent = `Cutscene: ${this.director.status} ${this.director.time.toFixed(1)}s\nDelivery: ${this.quests.get('delivery').status} (${this.quests.get('delivery').progress.parcel}/2)\nReturn: ${this.quests.get('return').status}\nCoins: ${coins}`;
  }
}
const story = new Story();
const showDialogue = (): void => {
  const view = story.dialogue.view;
  text.textContent = view?.text ?? 'Conversation finished.';
  choices.replaceChildren();
  for (const choice of view?.choices ?? []) {
    const button = document.createElement('button');
    button.textContent = choice.text;
    button.onclick = () => {
      story.dialogue.choose(choice.id);
      showDialogue();
    };
    choices.append(button);
  }
};
story.dialogue.addEventListener('postupdate', showDialogue);
const bind = (id: string, action: () => void | Promise<void>): void => {
  document.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = () => {
    error.textContent = '';
    void Promise.resolve()
      .then(action)
      .catch((reason) => {
        error.textContent = String(reason);
      });
  };
};
bind('pause', () => {
  if (story.director.status === 'paused') story.director.resume();
  else story.director.pause();
});
bind('cancel', () => story.director.cancel());
document.querySelector<HTMLInputElement>('#seek')!.oninput = (event) => {
  try {
    story.director.seek(Number((event.target as HTMLInputElement).value));
  } catch (reason) {
    error.textContent = String(reason);
  }
};
bind('parcel', () => story.quests.progress('delivery', 'parcel'));
bind('home', () => {
  if (story.quests.get('return').status === 'available')
    story.quests.accept('return');
  story.quests.progress('return', 'home');
});
bind('save', async () => {
  const payload = {
    dialogue: story.dialogue.save(),
    quests: story.quests.save(),
    coins,
  };
  assertJsonValue(payload);
  await saves.save('story', payload);
});
bind('restore', async () => {
  const loaded = await saves.load('story');
  if (loaded.status !== 'loaded') throw new Error('No valid saved story.');
  const payload = loaded.record.data as unknown as {
    dialogue: DialogueState;
    quests: QuestState;
    coins: number;
  };
  story.dialogue.restore(payload.dialogue);
  story.quests.restore(payload.quests);
  coins = payload.coins;
  if (story.director.status === 'waiting') {
    finishChoice?.();
    finishChoice = undefined;
  }
  showDialogue();
});
await game.setScene(story);
story.director.play();
game.start();
window.addEventListener(
  'pagehide',
  () => {
    game.destroy();
    saves.destroy();
  },
  { once: true },
);

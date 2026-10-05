import { GameObject } from './game-object.js';
import type { I18n } from './i18n.js';
import {
  conditionMatches,
  immutableData,
  narrativeText,
  validateCondition,
  validateGraph,
  validateVariables,
  type NarrativeCondition,
  type NarrativeText,
  type NarrativeValue,
  type NarrativeVariables,
} from './narrative-data.js';

export interface DialogueChoice {
  readonly id: string;
  readonly text: NarrativeText;
  readonly next: string;
  readonly condition?: NarrativeCondition;
  readonly set?: NarrativeVariables;
  readonly events?: readonly string[];
}
export interface DialogueNode {
  readonly id: string;
  readonly text: NarrativeText;
  readonly speaker?: string;
  readonly next?: string;
  readonly choices?: readonly DialogueChoice[];
  readonly set?: NarrativeVariables;
  readonly events?: readonly string[];
}
export interface DialogueDefinition {
  readonly id: string;
  readonly start: string;
  readonly nodes: readonly DialogueNode[];
  /** Cyclic conversations require explicit opt-in; each transition remains user-driven. */
  readonly allowCycles?: boolean;
  readonly variables?: NarrativeVariables;
}
export interface DialogueState {
  version: 1;
  definition: string;
  node: string | null;
  started: boolean;
  variables: Record<string, NarrativeValue>;
}
export interface DialogueView {
  readonly node: string;
  readonly text: string;
  readonly speaker?: string;
  readonly choices: readonly { readonly id: string; readonly text: string }[];
}
/** Scene.add(dialogue) owns its lifetime; dialogue transitions are explicit, not wall-time driven. */
export class Dialogue extends GameObject {
  readonly definition: DialogueDefinition;
  private readonly nodes = new Map<string, DialogueNode>();
  private values: Record<string, NarrativeValue>;
  private current: string | null = null;
  private begun = false;
  private transitioning = false;
  constructor(
    definition: DialogueDefinition,
    private readonly options: {
      i18n?: I18n;
      onEvent?: (event: string, dialogue: Dialogue) => void;
    } = {},
  ) {
    super();
    this.definition = immutableData(definition);
    if (!definition.id) throw new Error('Dialogue requires an ID.');
    for (const node of this.definition.nodes) {
      this.nodes.set(node.id, node);
      if (node.next && node.choices?.length)
        throw new Error('A dialogue node cannot have both next and choices.');
      validateVariables(node.set ?? {});
      const ids = new Set<string>();
      for (const choice of node.choices ?? []) {
        if (!choice.id || ids.has(choice.id))
          throw new Error('Dialogue choice IDs must be unique.');
        ids.add(choice.id);
        validateCondition(choice.condition);
        validateVariables(choice.set ?? {});
      }
    }
    validateGraph(
      this.definition.nodes.map((node) => node.id),
      (id) => {
        const node = this.nodes.get(id)!;
        return [
          ...(node.next ? [node.next] : []),
          ...(node.choices ?? []).map((choice) => choice.next),
        ];
      },
      definition.allowCycles,
    );
    if (!this.nodes.has(definition.start))
      throw new Error('Unknown dialogue start.');
    validateVariables(definition.variables ?? {});
    this.values = Object.assign(
      Object.create(null) as Record<string, NarrativeValue>,
      definition.variables,
    );
  }
  get variables(): NarrativeVariables {
    return { ...this.values };
  }
  get completed(): boolean {
    return this.begun && this.current === null;
  }
  get view(): DialogueView | null {
    if (this.current === null) return null;
    const node = this.nodes.get(this.current)!;
    return {
      node: node.id,
      text: narrativeText(node.text, this.values, this.options.i18n),
      speaker: node.speaker,
      choices: (node.choices ?? [])
        .filter((choice) => conditionMatches(choice.condition, this.values))
        .map((choice) => ({
          id: choice.id,
          text: narrativeText(choice.text, this.values, this.options.i18n),
        })),
    };
  }
  start(): void {
    this.transition(() => {
      if (this.begun) throw new Error('Dialogue has already started.');
      this.begun = true;
      this.enter(this.definition.start);
    });
  }
  advance(): void {
    this.transition(() => {
      const node = this.requireNode();
      if (node.choices?.length) throw new Error('Dialogue requires a choice.');
      this.enter(node.next ?? null);
    });
  }
  choose(id: string): void {
    this.transition(() => {
      const choice = this.requireNode().choices?.find((item) => item.id === id);
      if (!choice || !conditionMatches(choice.condition, this.values))
        throw new Error('Unavailable dialogue choice.');
      Object.assign(this.values, choice.set);
      this.current = choice.next;
      this.emit(choice.events);
      if (!this.destroyed) this.enter(choice.next);
    });
  }
  setVariable(key: string, value: NarrativeValue): void {
    if (this.destroyed || this.transitioning)
      throw new Error('Dialogue cannot be mutated now.');
    validateVariables({ [key]: value });
    this.values[key] = value;
  }
  save(): DialogueState {
    return {
      version: 1,
      definition: this.definition.id,
      node: this.current,
      started: this.begun,
      variables: { ...this.values },
    };
  }
  /** Restore never replays entry/choice events. Suitable for SaveManager payloads. */
  restore(state: DialogueState): void {
    if (this.destroyed || this.transitioning)
      throw new Error('Dialogue cannot restore now.');
    if (
      state.version !== 1 ||
      state.definition !== this.definition.id ||
      typeof state.started !== 'boolean' ||
      (state.node !== null && !this.nodes.has(state.node)) ||
      (!state.started && state.node !== null)
    )
      throw new Error('Invalid dialogue state.');
    validateVariables(state.variables);
    this.values = Object.assign(
      Object.create(null) as Record<string, NarrativeValue>,
      state.variables,
    );
    this.current = state.node;
    this.begun = state.started;
  }
  private requireNode(): DialogueNode {
    if (this.current === null) throw new Error('Dialogue is not active.');
    return this.nodes.get(this.current)!;
  }
  private enter(id: string | null): void {
    this.current = id;
    if (id === null) return;
    const node = this.nodes.get(id)!;
    Object.assign(this.values, node.set);
    this.emit(node.events);
  }
  private emit(events: readonly string[] | undefined): void {
    for (const event of events ?? []) {
      if (this.destroyed) break;
      this.options.onEvent?.(event, this);
    }
  }
  private transition(action: () => void): void {
    if (this.destroyed || this.transitioning)
      throw new Error('Dialogue transition is not reentrant.');
    this.transitioning = true;
    try {
      action();
    } finally {
      this.transitioning = false;
    }
  }
}

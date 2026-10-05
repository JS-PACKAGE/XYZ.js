import { GameObject } from './game-object.js';
import {
  immutableData,
  validateGraph,
  type NarrativeText,
} from './narrative-data.js';

export interface QuestObjective {
  readonly id: string;
  readonly target: number;
  readonly text?: NarrativeText;
}
export interface QuestDefinition {
  readonly id: string;
  readonly text?: NarrativeText;
  readonly prerequisites?: readonly string[];
  readonly objectives: readonly QuestObjective[];
  readonly rewards?: readonly string[];
}
export type QuestStatus =
  'locked' | 'available' | 'active' | 'completed' | 'failed';
export interface QuestRecord {
  status: QuestStatus;
  progress: Record<string, number>;
  rewarded: boolean;
}
export interface QuestState {
  version: 1;
  quests: Record<string, QuestRecord>;
}
/** Rewards are committed before callbacks: reentrancy, throws and restore cannot pay twice.
 * Persist reward application and this state in one SaveManager payload for crash consistency. */
export class QuestSystem extends GameObject {
  readonly definitions: readonly QuestDefinition[];
  private readonly byId = new Map<string, QuestDefinition>();
  private records: Record<string, QuestRecord> = Object.create(null) as Record<
    string,
    QuestRecord
  >;
  private mutating = false;
  constructor(
    definitions: readonly QuestDefinition[],
    private readonly options: {
      onReward?: (rewards: readonly string[], quest: string) => void;
      onTransition?: (quest: string, status: QuestStatus) => void;
    } = {},
  ) {
    super();
    this.definitions = immutableData(definitions);
    for (const quest of this.definitions) {
      this.byId.set(quest.id, quest);
      const objectives = new Set<string>();
      if (!quest.objectives.length)
        throw new Error('Quest requires objectives.');
      const progress: Record<string, number> = Object.create(null) as Record<
        string,
        number
      >;
      for (const objective of quest.objectives) {
        if (
          !objective.id ||
          objectives.has(objective.id) ||
          !Number.isFinite(objective.target) ||
          objective.target <= 0
        )
          throw new Error('Invalid quest objective.');
        objectives.add(objective.id);
        progress[objective.id] = 0;
      }
      this.records[quest.id] = {
        status: quest.prerequisites?.length ? 'locked' : 'available',
        progress,
        rewarded: false,
      };
    }
    validateGraph(
      this.definitions.map((quest) => quest.id),
      (id) => this.byId.get(id)!.prerequisites ?? [],
    );
  }
  get(id: string): Readonly<QuestRecord> {
    const record = this.records[id];
    if (!record || !this.byId.has(id)) throw new Error(`Unknown quest: ${id}`);
    return { ...record, progress: { ...record.progress } };
  }
  accept(id: string): void {
    this.mutate(() => {
      const record = this.require(id, 'available');
      record.status = 'active';
      this.options.onTransition?.(id, 'active');
    });
  }
  progress(id: string, objective: string, amount = 1): void {
    this.mutate(() => {
      const record = this.require(id, 'active');
      const definition = this.byId.get(id)!;
      const target = definition.objectives.find(
        (item) => item.id === objective,
      )?.target;
      if (target === undefined || !Number.isFinite(amount) || amount < 0)
        throw new Error('Invalid objective progress.');
      record.progress[objective] = Math.min(
        target,
        record.progress[objective] + amount,
      );
      if (
        !definition.objectives.every(
          (item) => record.progress[item.id] === item.target,
        )
      )
        return;
      record.status = 'completed';
      record.rewarded = true;
      // Unlock all dependants before exposing callbacks, so save sees a coherent graph.
      const unlocked: string[] = [];
      for (const quest of this.definitions) {
        if (
          this.records[quest.id].status === 'locked' &&
          quest.prerequisites!.every(
            (parent) => this.records[parent].status === 'completed',
          )
        ) {
          this.records[quest.id].status = 'available';
          unlocked.push(quest.id);
        }
      }
      this.options.onReward?.(definition.rewards ?? [], id);
      if (this.destroyed) return;
      this.options.onTransition?.(id, 'completed');
      for (const quest of unlocked) {
        if (this.destroyed) break;
        this.options.onTransition?.(quest, 'available');
      }
    });
  }
  fail(id: string): void {
    this.mutate(() => {
      const record = this.require(id, 'active');
      record.status = 'failed';
      this.options.onTransition?.(id, 'failed');
    });
  }
  save(): QuestState {
    return { version: 1, quests: structuredClone(this.records) };
  }
  /** Transactional validation; loading never issues rewards or transition events. */
  restore(state: QuestState): void {
    if (this.destroyed || this.mutating)
      throw new Error('Quest system cannot restore now.');
    if (
      state.version !== 1 ||
      !state.quests ||
      Object.keys(state.quests).length !== this.definitions.length
    )
      throw new Error('Invalid quest state.');
    for (const quest of this.definitions) {
      const record = state.quests[quest.id];
      if (
        !record ||
        !['locked', 'available', 'active', 'completed', 'failed'].includes(
          record.status,
        ) ||
        typeof record.rewarded !== 'boolean' ||
        !record.progress ||
        Object.keys(record.progress).length !== quest.objectives.length
      )
        throw new Error('Invalid quest record.');
      for (const objective of quest.objectives) {
        const value = record.progress[objective.id];
        if (!Number.isFinite(value) || value < 0 || value > objective.target)
          throw new Error('Invalid saved objective progress.');
      }
      const complete = quest.objectives.every(
        (item) => record.progress[item.id] === item.target,
      );
      if (
        (record.status === 'completed') !== record.rewarded ||
        (record.status === 'completed' && !complete) ||
        (record.status === 'active' && complete)
      )
        throw new Error('Inconsistent quest completion.');
      const unlocked = (quest.prerequisites ?? []).every(
        (parent) => state.quests[parent]?.status === 'completed',
      );
      if ((record.status === 'locked') === unlocked)
        throw new Error('Inconsistent quest prerequisites.');
      if (
        (record.status === 'available' || record.status === 'locked') &&
        quest.objectives.some((item) => record.progress[item.id] !== 0)
      )
        throw new Error('Inactive quest has progress.');
    }
    this.records = structuredClone(state.quests);
  }
  private require(id: string, status: QuestStatus): QuestRecord {
    if (!this.byId.has(id) || this.records[id].status !== status)
      throw new Error(`Quest ${id} is not ${status}.`);
    return this.records[id];
  }
  private mutate(action: () => void): void {
    if (this.destroyed || this.mutating)
      throw new Error('Quest mutation is not reentrant.');
    this.mutating = true;
    try {
      action();
    } finally {
      this.mutating = false;
    }
  }
}

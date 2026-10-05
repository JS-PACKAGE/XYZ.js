import { GameObject } from './game-object.js';
import { type NarrativeText } from './narrative-data.js';
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
export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'failed';
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
export declare class QuestSystem extends GameObject {
    private readonly options;
    readonly definitions: readonly QuestDefinition[];
    private readonly byId;
    private records;
    private mutating;
    constructor(definitions: readonly QuestDefinition[], options?: {
        onReward?: (rewards: readonly string[], quest: string) => void;
        onTransition?: (quest: string, status: QuestStatus) => void;
    });
    get(id: string): Readonly<QuestRecord>;
    accept(id: string): void;
    progress(id: string, objective: string, amount?: number): void;
    fail(id: string): void;
    save(): QuestState;
    /** Transactional validation; loading never issues rewards or transition events. */
    restore(state: QuestState): void;
    private require;
    private mutate;
}

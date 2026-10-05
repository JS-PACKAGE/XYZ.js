import { GameObject } from './game-object.js';
import type { I18n } from './i18n.js';
import { type NarrativeCondition, type NarrativeText, type NarrativeValue, type NarrativeVariables } from './narrative-data.js';
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
    readonly choices: readonly {
        readonly id: string;
        readonly text: string;
    }[];
}
/** Scene.add(dialogue) owns its lifetime; dialogue transitions are explicit, not wall-time driven. */
export declare class Dialogue extends GameObject {
    private readonly options;
    readonly definition: DialogueDefinition;
    private readonly nodes;
    private values;
    private current;
    private begun;
    private transitioning;
    constructor(definition: DialogueDefinition, options?: {
        i18n?: I18n;
        onEvent?: (event: string, dialogue: Dialogue) => void;
    });
    get variables(): NarrativeVariables;
    get completed(): boolean;
    get view(): DialogueView | null;
    start(): void;
    advance(): void;
    choose(id: string): void;
    setVariable(key: string, value: NarrativeValue): void;
    save(): DialogueState;
    /** Restore never replays entry/choice events. Suitable for SaveManager payloads. */
    restore(state: DialogueState): void;
    private requireNode;
    private enter;
    private emit;
    private transition;
}

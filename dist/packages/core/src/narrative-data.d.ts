import type { I18n } from './i18n.js';
export type NarrativeValue = string | number | boolean | null;
export type NarrativeVariables = Readonly<Record<string, NarrativeValue>>;
export type NarrativeCondition = {
    readonly variable: string;
    readonly equals: NarrativeValue;
} | {
    readonly all: readonly NarrativeCondition[];
} | {
    readonly any: readonly NarrativeCondition[];
} | {
    readonly not: NarrativeCondition;
};
export type NarrativeText = string | {
    readonly key: string;
};
export declare function conditionMatches(condition: NarrativeCondition | undefined, variables: NarrativeVariables): boolean;
export declare function narrativeText(text: NarrativeText, variables: NarrativeVariables, i18n?: I18n): string;
export declare function validateVariables(value: unknown): asserts value is Record<string, NarrativeValue>;
/** Clone before freezing: caller data remains caller-owned. */
export declare function immutableData<T>(value: T): T;
export declare function validateCondition(condition: NarrativeCondition | undefined): void;
export declare function validateGraph(nodes: readonly string[], edges: (id: string) => readonly string[], allowCycles?: boolean): void;

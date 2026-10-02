export type TextCaretAffinity = 'upstream' | 'downstream';
/** Native selection offsets stay UTF-16; only visual navigation snaps to clusters. */
export declare function graphemeBoundaries(text: string, locale?: string): readonly number[];
export declare function snapGrapheme(boundaries: readonly number[], index: number, affinity?: TextCaretAffinity): number;

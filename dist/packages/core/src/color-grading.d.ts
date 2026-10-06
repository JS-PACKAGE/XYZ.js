export type ToneMapper = 'none' | 'aces' | 'agx' | 'reinhard' | 'neutral';
export declare function validatePostNumber(value: number, name: string): void;
/** RGB lattice in .cube order (red changes fastest); uploaded as an RGBA8 strip. */
export declare class ColorLUT3D {
    readonly size: number;
    readonly strip: Uint8Array;
    constructor(size: number, values: ArrayLike<number>);
    static parseCube(text: string): ColorLUT3D;
    static preset(size?: number, kind?: 'identity' | 'warm' | 'cool' | 'cinematic'): ColorLUT3D;
}
export declare class ColorGradingSettings {
    lut: ColorLUT3D;
    strength: number;
    constructor(lut: ColorLUT3D, strength?: number);
    validate(): void;
}

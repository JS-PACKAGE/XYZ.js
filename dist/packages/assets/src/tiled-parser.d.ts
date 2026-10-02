export declare class TiledError extends Error {
    readonly path: string;
    constructor(path: string, message: string);
}
export type TiledProperties = Readonly<Record<string, string | number | boolean>>;
export interface TiledObject {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    visible: boolean;
    properties: TiledProperties;
    polygon?: readonly (readonly [number, number])[];
    ellipse: boolean;
}
export interface TiledLayer {
    id: number;
    name: string;
    type: 'tilelayer' | 'objectgroup';
    opacity: number;
    visible: boolean;
    x: number;
    y: number;
    properties: TiledProperties;
    data: readonly number[];
    objects: readonly TiledObject[];
}
export interface TiledTileset {
    firstgid: number;
    name: string;
    image: string;
    tileWidth: number;
    tileHeight: number;
    imageWidth: number;
    imageHeight: number;
    columns: number;
    tileCount: number;
    margin: number;
    spacing: number;
    properties: TiledProperties;
    tiles: ReadonlyMap<number, TiledProperties>;
}
export interface TiledMapData {
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    properties: TiledProperties;
    layers: readonly TiledLayer[];
    tilesets: readonly TiledTileset[];
}
type Obj = Record<string, unknown>;
export declare function tiledRecord(value: unknown, path: string): Obj;
export declare function parseTiledTileset(value: unknown, firstgid: number, path?: string): TiledTileset;
export declare function parseTiledMap(value: unknown, tilesets: readonly TiledTileset[]): TiledMapData;
export {};

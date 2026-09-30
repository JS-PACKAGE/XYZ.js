import { TileMap, type TileMapOptions } from './tile-map.js';

export interface IsometricMapOptions extends TileMapOptions {
  elevationStep?: number;
}

/** Isometric atlas rectangles use anchor (0.5, 0), with their origin at the diamond's top vertex. */
export class IsometricMap extends TileMap {
  constructor(options: IsometricMapOptions) {
    const step = options.elevationStep ?? options.tileHeight / 2;
    if (!Number.isFinite(step) || step < 0)
      throw new RangeError('elevationStep must be finite and nonnegative.');
    super(options);
    this.isometric = true;
    this.elevationStep = step;
  }
}

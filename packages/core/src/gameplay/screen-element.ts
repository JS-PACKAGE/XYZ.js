import { Group2D } from './group2d.js';

/** Logical screen coordinates, unaffected by the world's camera. */
export class ScreenElement extends Group2D {
  constructor() {
    super();
    this.space = 'screen';
  }
}

import type { Renderer, Material2D } from '../../src/index.js';

// Frozen v1.10 member list: additions must not become mandatory for implementors.
type PreviousMembers =
  | 'backend'
  | 'capabilities'
  | 'stats'
  | 'residency'
  | 'configureResidency'
  | 'prepareGeometry'
  | 'unloadGeometry'
  | 'prepareResource'
  | 'retainFrameResources'
  | 'initialize'
  | 'beginFrame'
  | 'render'
  | 'captureScene'
  | 'preparePostProcessor'
  | 'createRenderTexture'
  | 'renderToTexture'
  | 'extractPixels'
  | 'generateTexture'
  | 'prepareTextures'
  | 'unloadTexture'
  | 'endFrame'
  | 'resize'
  | 'destroy';
interface PreviousRenderer extends Pick<Renderer, PreviousMembers> {
  prepareMaterial(material: Material2D): Promise<void>;
}
declare const implementation: PreviousRenderer;
export const renderer: Renderer = implementation;

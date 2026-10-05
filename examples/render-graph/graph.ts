import { RenderGraph } from '../../packages/graphics/src/render-graph.js';
import { PostProcessor2D } from '../../packages/core/src/materials2d/material2d.js';

/** Native diamond: two independent scene samples, then a multi-attachment merge. */
export function createChannelGraph(branchScale = 1): {
  graph: RenderGraph;
  merge: PostProcessor2D;
  destroy(): void;
} {
  const red = new PostProcessor2D({
    wgsl: 'fn effect(c:vec4f,uv:vec2f,s:vec2f)->vec4f{return vec4f(c.r,0.0,0.0,c.a);}',
    glsl: 'vec4 effect(vec4 c,vec2 uv,vec2 s){return vec4(c.r,0.0,0.0,c.a);}',
  });
  const blue = new PostProcessor2D({
    wgsl: 'fn effect(c:vec4f,uv:vec2f,s:vec2f)->vec4f{return vec4f(0.0,0.0,c.b,c.a);}',
    glsl: 'vec4 effect(vec4 c,vec2 uv,vec2 s){return vec4(0.0,0.0,c.b,c.a);}',
  });
  const merge = new PostProcessor2D({
    uniforms: [1],
    wgsl: 'fn effect(c:vec4f,uv:vec2f,s:vec2f)->vec4f{return vec4f(c.r,0.0,sampleInput1(uv).b*uniformValue(0u).x,c.a);}',
    glsl: 'vec4 effect(vec4 c,vec2 uv,vec2 s){return vec4(c.r,0.0,sampleInput1(uv).b*uniformValue(0).x,c.a);}',
  });
  const graph = new RenderGraph({
    targets: [
      { name: 'red' },
      { name: 'blue', scale: branchScale },
      { name: 'merged' },
    ],
    passes: [
      // Intentionally authored before its producers: scheduling follows resources, not array order.
      {
        name: 'merge',
        inputs: ['red', 'blue'],
        output: 'merged',
        effect: merge,
      },
      { name: 'blueBranch', inputs: ['$scene'], output: 'blue', effect: blue },
      { name: 'redBranch', inputs: ['$scene'], output: 'red', effect: red },
    ],
    output: 'merged',
  });
  return {
    graph,
    merge,
    destroy() {
      graph.destroy();
      red.destroy();
      blue.destroy();
      merge.destroy();
    },
  };
}

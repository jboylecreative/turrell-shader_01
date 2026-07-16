// Minimal fullscreen vertex shader.
// NOTE: no explicit `#version` line — Three.js (RawShaderMaterial + GLSL3)
// prepends `#version 300 es`, and TouchDesigner's GLSL TOP likewise supplies the
// version header. Keeping it out of the source keeps these files portable.
//
// PORTABLE: In TouchDesigner a GLSL TOP already runs per-pixel over a fullscreen
// quad, so this vertex stage has no equivalent there — it exists only to feed a
// screen-filling triangle to the fragment shader in WebGL. Keep it trivial.
//
// aPosition is a clip-space fullscreen triangle (-1..3). vUv is 0..1 across the
// visible frame.
precision highp float;

// The attribute is named `position` because Three.js derives the draw vertex
// count from geometry.attributes.position. In a TouchDesigner GLSL TOP this
// vertex stage is not needed at all.
in vec3 position;
out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}

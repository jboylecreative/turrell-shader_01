// -----------------------------------------------------------------------------
// InteractionPass — Pass 2. Reads the strata texture and produces display output.
//   Browser InteractionPass  →  TouchDesigner "Interaction GLSL TOP" + output.
//
// Renders to the default framebuffer (the visible canvas). The fragment shader
// performs the single sRGB conversion, so the WebGLRenderer output color space
// is left LINEAR to avoid a double conversion (set in Renderer).
// -----------------------------------------------------------------------------

import * as THREE from "three";
import vertSrc from "./shaders/fullscreen.vert.glsl";
import fragSrc from "./shaders/interaction.frag.glsl";
import type { UniformManager } from "./UniformManager";

export class InteractionPass {
  readonly material: THREE.RawShaderMaterial;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();

  constructor(geometry: THREE.BufferGeometry, uniforms: UniformManager) {
    this.material = new THREE.RawShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      glslVersion: THREE.GLSL3,
      uniforms: uniforms.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false; // no "position" attribute → skip culling
    this.scene.add(mesh);
  }

  render(renderer: THREE.WebGLRenderer): void {
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.material.dispose();
  }
}

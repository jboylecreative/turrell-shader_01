// -----------------------------------------------------------------------------
// StrataPass — Pass 1. Renders the strata field into a render target.
//   Browser StrataPass  →  TouchDesigner "Strata GLSL TOP".
//
// This is a thin Three.js wrapper: it owns a RawShaderMaterial whose fragment
// source is the portable strata.frag.glsl entry point, plus a fullscreen scene.
// All artistic logic lives in the GLSL, never here.
// -----------------------------------------------------------------------------

import * as THREE from "three";
import vertSrc from "./shaders/fullscreen.vert.glsl";
import fragSrc from "./shaders/strata.frag.glsl";
import type { UniformManager } from "./UniformManager";

export class StrataPass {
  readonly material: THREE.RawShaderMaterial;
  readonly target: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();

  constructor(geometry: THREE.BufferGeometry, uniforms: UniformManager, width: number, height: number) {
    this.material = new THREE.RawShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      glslVersion: THREE.GLSL3,
      uniforms: uniforms.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    // The geometry has no "position" attribute (we use aPosition), so Three
    // cannot compute bounds — disable culling or the fullscreen mesh vanishes.
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    this.target = new THREE.WebGLRenderTarget(width, height, {
      // Linear working space; the interaction pass does the sRGB conversion.
      colorSpace: THREE.LinearSRGBColorSpace,
      type: THREE.HalfFloatType,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  render(renderer: THREE.WebGLRenderer): void {
    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, this.camera);
  }

  get texture(): THREE.Texture {
    return this.target.texture;
  }

  dispose(): void {
    this.material.dispose();
    this.target.dispose();
  }
}

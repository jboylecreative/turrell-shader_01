// -----------------------------------------------------------------------------
// Renderer: the disposable Three.js wrapper. Owns the WebGLRenderer, the two
// portable passes, sizing/letterboxing, fullscreen, and the frame loop.
//
// PORTABILITY NOTE: everything in this file is browser scaffolding that will be
// rebuilt in TouchDesigner. It must contain NO artistic logic — only pipeline
// orchestration. The art lives in the GLSL and the state.
// -----------------------------------------------------------------------------

import * as THREE from "three";
import { StrataPass } from "./StrataPass";
import { InteractionPass } from "./InteractionPass";
import { UniformManager } from "./UniformManager";
import type { PresetState } from "../app/types";

export type ShaderErrorHandler = (message: string) => void;
/** Called each frame with REAL (unscaled) time — for structural motion and
 * queue timing. The time-scaled animation clock is the uTime uniform. */
export type FrameCallback = (realTime: number, realDt: number) => void;

export class Renderer {
  readonly uniforms = new UniformManager();
  private renderer: THREE.WebGLRenderer;
  private geometry: THREE.BufferGeometry;
  private strataPass: StrataPass;
  private interactionPass: InteractionPass;

  private running = false;
  private rafId = 0;
  private lastReal = 0;
  private startPerf = 0; // performance.now() at first frame
  private animTime = 0; // scaled, accumulated animation clock (seconds)
  private realTime = 0; // exact unscaled wall clock (seconds), for input/structure

  private frameCallback: FrameCallback | null = null;
  private internalW = 0;
  private internalH = 0;
  private fps = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private getState: () => PresetState,
    onShaderError?: ShaderErrorHandler,
  ) {
    assertWebGL2(canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      // Enables reading back / capturing the rendered frame (used by future
      // frame-export features and by automated visual verification).
      preserveDrawingBuffer: true,
    });
    // We do our own sRGB conversion in the final pass; keep Three in linear so
    // it does not double-convert.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    if (onShaderError) {
      this.renderer.debug.onShaderError = (
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        vs: WebGLShader,
        fs: WebGLShader,
      ) => {
        const vsLog = gl.getShaderInfoLog(vs) ?? "";
        const fsLog = gl.getShaderInfoLog(fs) ?? "";
        const progLog = gl.getProgramInfoLog(program) ?? "";
        onShaderError(
          [progLog, fsLog, vsLog].filter(Boolean).join("\n").trim() ||
            "Unknown shader compile error",
        );
      };
    }

    this.geometry = createFullscreenTriangle();

    const { width, height } = this.getState().resolution;
    this.strataPass = new StrataPass(this.geometry, this.uniforms, width, height);
    this.interactionPass = new InteractionPass(this.geometry, this.uniforms);
    this.uniforms.setStrataTexture(this.strataPass.texture);

    // Size the output framebuffer to the internal resolution up front; CSS
    // letterboxing (resize) controls the displayed size independently.
    this.renderer.setSize(width, height, false);
    this.uniforms.setResolution(width, height);
    this.internalW = width;
    this.internalH = height;

    this.resize();
    window.addEventListener("resize", this.resize);
  }

  setFrameCallback(cb: FrameCallback): void {
    this.frameCallback = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastReal = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  get currentTime(): number {
    return this.animTime;
  }

  /** Unscaled wall-clock seconds since start (matches FrameCallback's realTime). */
  get realTimeNow(): number {
    return this.realTime;
  }

  get frameRate(): number {
    return this.fps;
  }

  get renderResolution(): { width: number; height: number } {
    const t = this.strataPass.target;
    return { width: t.width, height: t.height };
  }

  /** DEV-ONLY diagnostic: force a fresh render, then sample the default
   * framebuffer centre. */
  debugSample(): { screen: number[] } {
    const gl = this.renderer.getContext();
    const state = this.getState();
    this.uniforms.sync(state);
    this.strataPass.render(this.renderer);
    this.interactionPass.render(this.renderer);
    const screen = new Uint8Array(4);
    gl.readPixels(this.internalW >> 1, this.internalH >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, screen);
    return { screen: [...screen] };
  }

  toggleFullscreen(): void {
    const stage = this.canvas.parentElement ?? this.canvas;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void stage.requestFullscreen();
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    const now = performance.now();
    if (this.startPerf === 0) this.startPerf = now;
    // realTime is EXACT wall-clock (never clamped) so input timing — double-click
    // protection, queue pacing — stays correct even when frames hitch.
    this.realTime = (now - this.startPerf) / 1000;
    // dtReal is clamped only for stepping animation/structure so a stall doesn't
    // cause a visual leap.
    const dtReal = Math.min((now - this.lastReal) / 1000, 0.1);
    this.lastReal = now;

    const state = this.getState();
    const frozen = state.global.pause || state.debug.freezeTime;
    const dt = frozen ? 0 : dtReal * state.global.timeScale * state.global.motionAmount;
    this.animTime += dt;

    // FPS (rolling ~0.5s window).
    this.fpsAccum += dtReal;
    this.fpsFrames++;
    if (this.fpsAccum >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }

    this.applyPreviewQuality(state);
    this.uniforms.sync(state);
    this.uniforms.setTime(this.animTime);

    // Structural motion (strata lifecycle, queue) runs on REAL time so it is
    // independent of the visual time-scale. Pause/freeze also halts it (dt→0).
    if (this.frameCallback) this.frameCallback(this.realTime, frozen ? 0 : dtReal);

    this.strataPass.render(this.renderer);
    this.interactionPass.render(this.renderer);
  };

  private applyPreviewQuality(state: PresetState): void {
    const q = clamp(state.global.previewQuality, 0.25, 1);
    const w = Math.round(state.resolution.width * q);
    const h = Math.round(state.resolution.height * q);
    if (this.internalW !== w || this.internalH !== h) {
      this.strataPass.setSize(w, h);
      this.renderer.setSize(w, h, false); // false: we control CSS letterboxing
      this.uniforms.setResolution(w, h);
      this.internalW = w;
      this.internalH = h;
    }
  }

  // Letterbox the fixed 16:9 composition into the stage, preserving aspect.
  private resize = (): void => {
    const stage = this.canvas.parentElement;
    if (!stage) return;
    const availW = stage.clientWidth;
    const availH = stage.clientHeight;
    const target = this.getState().resolution;
    const aspect = target.width / target.height;

    let w = availW;
    let h = w / aspect;
    if (h > availH) {
      h = availH;
      w = h * aspect;
    }
    this.canvas.style.width = `${Math.round(w)}px`;
    this.canvas.style.height = `${Math.round(h)}px`;
  };

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.resize);
    this.strataPass.dispose();
    this.interactionPass.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
  }
}

/** A single clip-space triangle that covers the whole screen (-1..3).
 * The attribute MUST be named "position": Three.js derives the draw vertex count
 * from geometry.attributes.position, so any other name renders nothing. It is
 * 3-component (z = 0) so Three's bounding-sphere math stays finite. */
function createFullscreenTriangle(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const positions = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

function assertWebGL2(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error(
      "WebGL 2 is not available in this browser. This prototype requires WebGL 2 / GLSL ES 3.00.",
    );
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

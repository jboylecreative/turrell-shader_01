// -----------------------------------------------------------------------------
// HistoryManager: the rolling stack of order strata and their lifecycle
// animation. Framework-independent — this same model (positions, seeds, states)
// will be reconstructed in TouchDesigner from CHOP channels / DAT rows.
//
// Ordering: strata[0] is the NEWEST (top of frame); the last is the OLDEST.
// Vertical positions are normalized 0..1 (0 = top of frame, 1 = bottom).
//
// Structural motion (entry / shift / exit) runs on REAL time and a critically-
// damped-ish spring so it reads as one reorganizing image. The time-scaled
// animation clock (uTime) is reserved for the in-shader resting shimmer.
// -----------------------------------------------------------------------------

import { MAX_STRATA, type BeverageId, type OrderStratum, type PresetState } from "./types";
import { BEVERAGE_IDS } from "./types";

export interface RuntimeStratum extends OrderStratum {
  vTop: number;
  vBottom: number;
  exitStartedAt: number;
}

let idCounter = 0;

export class HistoryManager {
  /** index 0 = newest / top. May briefly hold MAX_STRATA + 1 during an exit. */
  readonly strata: RuntimeStratum[] = [];
  private orderCounter = 0;

  constructor(private getState: () => PresetState) {}

  get visibleCount(): number {
    return clampInt(this.getState().history.visibleCount, 1, MAX_STRATA);
  }

  /** Live count the shader iterates (visible + any exiting). */
  get liveCount(): number {
    return this.strata.length;
  }

  /** Add a new order at the top and push the stack down. */
  addOrder(beverageId: BeverageId, realTime: number): RuntimeStratum {
    const seed = this.nextSeed();
    const h = 1 / Math.max(1, this.visibleCount);
    const s: RuntimeStratum = {
      id: `o${idCounter++}`,
      beverageId,
      createdAt: realTime,
      seed,
      activationStartedAt: realTime,
      state: "entering",
      // Start just above the frame so it slides in from the top.
      currentTop: -h,
      currentBottom: 0,
      targetTop: 0,
      targetBottom: h,
      vTop: 0,
      vBottom: 0,
      exitStartedAt: 0,
    };
    this.strata.unshift(s);
    this.enforceLimit(realTime);
    this.relayout();
    return s;
  }

  /** Remove the newest order (undo). Returns true if one was removed. */
  removeNewest(realTime: number): boolean {
    const idx = this.strata.findIndex((s) => s.state !== "exiting");
    if (idx === -1) return false;
    this.beginExit(this.strata[idx], realTime);
    this.relayout();
    return true;
  }

  clear(realTime: number): void {
    for (const s of this.strata) this.beginExit(s, realTime);
    this.relayout();
  }

  /** Replace history with a deterministic seeded set (Generate Random History). */
  generateRandom(seed: number, realTime: number): void {
    this.strata.length = 0;
    const rng = mulberry32(seed >>> 0);
    const st = this.getState().history;
    const max = clampInt(st.maximumCount, 1, MAX_STRATA);
    const count = st.randomizeInitialCount
      ? 1 + Math.floor(rng() * max)
      : clampInt(st.initialCount, 0, max);
    // Oldest first so the newest ends up at index 0 after unshifting.
    for (let i = 0; i < count; i++) {
      const bev = BEVERAGE_IDS[Math.floor(rng() * BEVERAGE_IDS.length)];
      const s = this.addOrder(bev, realTime);
      // Snap initial history into place (no fly-in animation on load).
      this.snapToTarget(s);
    }
    // Snap everything after final relayout.
    this.relayout();
    for (const s of this.strata) {
      this.snapToTarget(s);
      if (s.state === "entering") s.state = "resting";
    }
  }

  /** Advance the lifecycle springs and cull finished exits. */
  update(realTime: number, dt: number): void {
    const st = this.getState().strataLayout;
    const enterOmega = springOmega(st.entryDuration);
    const shiftOmega = springOmega(st.shiftDuration);
    const exitOmega = springOmega(st.exitDuration);
    // Overshoot lowers damping ratio; settlingDamping raises it.
    const zeta = clamp(1 - st.overshoot * 0.8 + (st.settlingDamping - 0.8) * 0.25, 0.35, 1.2);

    for (const s of this.strata) {
      const omega =
        s.state === "entering" ? enterOmega : s.state === "exiting" ? exitOmega : shiftOmega;
      s.currentTop = spring(s.currentTop, s.targetTop, s.vTop, omega, zeta, dt, (v) => (s.vTop = v));
      s.currentBottom = spring(
        s.currentBottom,
        s.targetBottom,
        s.vBottom,
        omega,
        zeta,
        dt,
        (v) => (s.vBottom = v),
      );
      if (s.state === "entering" && Math.abs(s.currentTop - s.targetTop) < 0.004) {
        s.state = "resting";
      }
    }

    // Cull exits that have left the frame or run past their exit duration.
    for (let i = this.strata.length - 1; i >= 0; i--) {
      const s = this.strata[i];
      if (s.state === "exiting") {
        const done = s.currentTop > 1.001 || realTime - s.exitStartedAt > this.getState().strataLayout.exitDuration + 0.5;
        if (done) this.strata.splice(i, 1);
      }
    }
  }

  // ---- internal -------------------------------------------------------------

  private enforceLimit(realTime: number): void {
    const visible = this.strata.filter((s) => s.state !== "exiting");
    let overflow = visible.length - this.visibleCount;
    for (let i = visible.length - 1; i >= 0 && overflow > 0; i--, overflow--) {
      this.beginExit(visible[i], realTime);
    }
  }

  private beginExit(s: RuntimeStratum, realTime: number): void {
    if (s.state === "exiting") return;
    s.state = "exiting";
    s.exitStartedAt = realTime;
  }

  /** Recompute target bands for all resting/entering strata (and exits). */
  private relayout(): void {
    const st = this.getState().strataLayout;
    const visible = this.strata.filter((s) => s.state !== "exiting");
    const n = visible.length;

    const heights = visible.map((s, i) => {
      const varf = 1 + (hashSeed(s.seed) - 0.5) * st.heightVariation;
      const comp = 1 - st.stackCompression * (n > 1 ? i / (n - 1) : 0);
      const tilt = n > 1 ? 1 + (st.heightWeighting - 0.5) * (i / (n - 1) - 0.5) * 2 : 1;
      return Math.max(0.02, varf * comp * tilt);
    });
    const total = heights.reduce((a, b) => a + b, 0) || 1;

    let y = 0;
    visible.forEach((s, i) => {
      const h = heights[i] / total;
      s.targetTop = y;
      s.targetBottom = y + h;
      y += h;
    });

    // Exiting strata slide off the bottom, keeping their current height.
    for (const s of this.strata) {
      if (s.state === "exiting") {
        const h = Math.max(0.02, s.currentBottom - s.currentTop);
        s.targetTop = 1.0;
        s.targetBottom = 1.0 + h;
      }
    }
  }

  private snapToTarget(s: RuntimeStratum): void {
    s.currentTop = s.targetTop;
    s.currentBottom = s.targetBottom;
    s.vTop = 0;
    s.vBottom = 0;
  }

  /** Deterministic per-order seed in [0,1) derived from the global randomSeed. */
  private nextSeed(): number {
    const base = (this.getState().randomSeed >>> 0) + this.orderCounter++ * 2654435761;
    return mulberry32(base >>> 0)();
  }
}

// ---- math helpers (portable, no framework) ----------------------------------

function springOmega(durationSeconds: number): number {
  // ~settles within `duration` seconds for a critically damped response.
  return 5.5 / Math.max(0.08, durationSeconds);
}

/** Semi-implicit damped spring step; writes back velocity, returns new position. */
function spring(
  x: number,
  target: number,
  v: number,
  omega: number,
  zeta: number,
  dt: number,
  setV: (v: number) => void,
): number {
  const a = omega * omega * (target - x) - 2 * zeta * omega * v;
  const nv = v + a * dt;
  setV(nv);
  return x + nv * dt;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable hash of a [0,1) seed into another [0,1) value. */
function hashSeed(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// -----------------------------------------------------------------------------
// EventQueue: orders never get silently dropped. Presses enqueue events; one
// primary active cascade plays at a time; the next may begin once the strongest
// phase of the previous is complete (min interval + overlap). All timing is in
// REAL seconds.
//
// Framework-independent: in TouchDesigner this becomes a DAT/CHOP-driven queue
// managed in Python. The activation itself is delegated via onActivate so this
// class knows nothing about the renderer or history internals.
// -----------------------------------------------------------------------------

import type { BeverageId, PresetState } from "./types";

interface QueuedEvent {
  beverageId: BeverageId;
  enqueuedAt: number;
}

export class EventQueue {
  private pending: QueuedEvent[] = [];
  private lastStartTime = -Infinity;
  private lastPressTime = -Infinity;
  private activeBeverage: BeverageId | null = null;
  private activeStartedAt = -Infinity;

  constructor(
    private getState: () => PresetState,
    /** Called when an event becomes active; must create the stratum. */
    private onActivate: (beverageId: BeverageId, realTime: number) => void,
  ) {}

  get length(): number {
    return this.pending.length;
  }

  get activeLabel(): string | null {
    if (!this.activeBeverage) return null;
    return this.getState().beverages[this.activeBeverage]?.label ?? null;
  }

  /** Enqueue a press, honouring double-click protection. Returns false if ignored. */
  enqueue(beverageId: BeverageId, realTime: number): boolean {
    const q = this.getState().queue;
    if (
      q.doubleClickProtection &&
      realTime - this.lastPressTime < q.doubleClickInterval
    ) {
      this.lastPressTime = realTime;
      return false;
    }
    this.lastPressTime = realTime;
    this.pending.push({ beverageId, enqueuedAt: realTime });
    return true;
  }

  /** Advance: expire the finished active event, then start the next if paced. */
  update(realTime: number): void {
    if (
      this.activeBeverage &&
      realTime - this.activeStartedAt > this.getState().cascade.duration
    ) {
      this.activeBeverage = null;
    }
    if (this.pending.length === 0) return;
    if (realTime >= this.nextAllowedStart()) {
      this.startNext(realTime);
    }
  }

  /** Force the next queued event to start now (Skip). */
  skip(realTime: number): void {
    if (this.pending.length > 0) {
      this.startNext(realTime);
    }
  }

  clear(): void {
    this.pending.length = 0;
  }

  /** Undo: drop the most recently enqueued (not-yet-active) event, if any.
   *  Returns true if a pending event was removed; false if the caller should
   *  instead undo an already-committed order. */
  undoPending(): boolean {
    if (this.pending.length > 0) {
      this.pending.pop();
      return true;
    }
    return false;
  }

  private nextAllowedStart(): number {
    const q = this.getState().queue;
    const cascade = this.getState().cascade;
    // Next may begin after the min interval, and after the primary phase of the
    // previous cascade (shortened by the overlap amount).
    const primaryPhase = cascade.duration * (1 - clamp(q.overlapAmount, 0, 1));
    return this.lastStartTime + Math.max(q.minInterval, Math.min(primaryPhase, cascade.duration));
  }

  private startNext(realTime: number): void {
    const ev = this.pending.shift();
    if (!ev) return;
    this.activeBeverage = ev.beverageId;
    this.activeStartedAt = realTime;
    this.lastStartTime = realTime;
    this.onActivate(ev.beverageId, realTime);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

import { dampedApproach, isSettled } from '../utils/easing';

export interface AnimatorOptions {
  damping: number;
  onFrame: (rotation: number) => void;
  onStart?: () => void;
  onSettle?: (finalRotation: number) => void;
}

/**
 * Single source of truth for cylinder rotation. Every card's transform is
 * re-derived from this each frame — there is no per-card animation state.
 */
export class Animator {
  private rafId: number | null = null;
  private rotation: number;
  private target: number;
  private damping: number;
  private running = false;

  private onFrame: (rotation: number) => void;
  private onStart?: () => void;
  private onSettle?: (finalRotation: number) => void;

  constructor(initialRotation: number, options: AnimatorOptions) {
    this.rotation = initialRotation;
    this.target = initialRotation;
    this.damping = options.damping;
    this.onFrame = options.onFrame;
    this.onStart = options.onStart;
    this.onSettle = options.onSettle;
  }

  setDamping(damping: number) {
    this.damping = damping;
  }

  getRotation(): number {
    return this.rotation;
  }

  animateTo(target: number) {
    this.target = target;
    if (!this.running) {
      this.running = true;
      this.onStart?.();
    }
    this.cancel();
    this.tick();
  }

  private tick = () => {
    if (isSettled(this.rotation, this.target)) {
      this.rotation = this.target;
      this.running = false;
      this.onFrame(this.rotation);
      this.onSettle?.(this.rotation);
      return;
    }

    this.rotation = dampedApproach(this.rotation, this.target, this.damping);
    this.onFrame(this.rotation);
    this.rafId = requestAnimationFrame(this.tick);
  };

  cancel() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.cancel();
    this.running = false;
  }
}

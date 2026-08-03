export interface MouseBindingOptions {
  element: HTMLElement;
  onNext: () => void;
  onPrev: () => void;
  isAnimating: () => boolean;
  cooldownMs?: number;
  enabled?: boolean;
}

export class MouseInput {
  private element: HTMLElement;
  private onNext: () => void;
  private onPrev: () => void;
  private isAnimating: () => boolean;
  private cooldownMs: number;
  private locked = false;
  private enabled: boolean;

  constructor(options: MouseBindingOptions) {
    this.element = options.element;
    this.onNext = options.onNext;
    this.onPrev = options.onPrev;
    this.isAnimating = options.isAnimating;
    this.cooldownMs = options.cooldownMs ?? 650;
    this.enabled = options.enabled ?? true;
  }

  private handleWheel = (e: WheelEvent) => {
    if (!this.enabled) return;
    e.preventDefault();
    if (this.locked || this.isAnimating()) return;
    this.locked = true;
    (e.deltaX > 0 || e.deltaY > 0) ? this.onNext() : this.onPrev();
    setTimeout(() => {
      this.locked = false;
    }, this.cooldownMs);
  };

  attach() {
    this.element.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  detach() {
    this.element.removeEventListener('wheel', this.handleWheel as EventListener);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

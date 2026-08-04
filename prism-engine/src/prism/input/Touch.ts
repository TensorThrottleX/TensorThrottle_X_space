export interface TouchBindingOptions {
  element: HTMLElement;
  onNext: () => void;
  onPrev: () => void;
  isAnimating: () => boolean;
  swipeThresholdPx?: number;
  enabled?: boolean;
}

export class TouchInput {
  private element: HTMLElement;
  private onNext: () => void;
  private onPrev: () => void;
  private isAnimating: () => boolean;
  private threshold: number;
  private startX: number | null = null;
  private enabled: boolean;

  constructor(options: TouchBindingOptions) {
    this.element = options.element;
    this.onNext = options.onNext;
    this.onPrev = options.onPrev;
    this.isAnimating = options.isAnimating;
    this.threshold = options.swipeThresholdPx ?? 38;
    this.enabled = options.enabled ?? true;
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (!this.enabled) return;
    this.startX = e.touches[0].clientX;
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.enabled || this.startX === null || this.isAnimating()) return;
    
    // Check if element is substantially visible
    const rect = this.element.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    const visiblePercentage = visibleHeight / rect.height;
    
    if (visiblePercentage < 0.5) {
      this.startX = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - this.startX;
    if (Math.abs(dx) > this.threshold) {
      dx < 0 ? this.onNext() : this.onPrev();
    }
    this.startX = null;
  };

  attach() {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  detach() {
    this.element.removeEventListener('touchstart', this.handleTouchStart as EventListener);
    this.element.removeEventListener('touchend', this.handleTouchEnd as EventListener);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

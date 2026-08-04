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
  private carouselInteractionEnabled = false;

  constructor(options: MouseBindingOptions) {
    this.element = options.element;
    this.onNext = options.onNext;
    this.onPrev = options.onPrev;
    this.isAnimating = options.isAnimating;
    this.cooldownMs = options.cooldownMs ?? 650;
    this.enabled = options.enabled ?? true;
  }

  private handleMouseMove = (e: MouseEvent) => {
    // Only enable if there was actual physical mouse movement
    // This prevents "fake" enters caused by scrolling the page under the cursor
    if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
      this.carouselInteractionEnabled = true;
    }
  };

  private handleMouseLeave = () => {
    this.carouselInteractionEnabled = false;
  };

  private handleWheel = (e: WheelEvent) => {
    if (!this.enabled || !this.carouselInteractionEnabled) return;
    
    // Check if element is substantially visible
    const rect = this.element.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Visible height of the element
    const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    const visiblePercentage = visibleHeight / rect.height;
    
    // Only accept interaction if it's at least ~50% visible
    if (visiblePercentage < 0.5) return;

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
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  detach() {
    this.element.removeEventListener('wheel', this.handleWheel as EventListener);
    this.element.removeEventListener('mousemove', this.handleMouseMove as EventListener);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

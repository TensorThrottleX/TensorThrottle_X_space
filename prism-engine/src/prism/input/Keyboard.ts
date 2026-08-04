export interface KeyboardBindingOptions {
  target?: Window | Document;
  onNext: () => void;
  onPrev: () => void;
  enabled?: boolean;
}

export class KeyboardInput {
  private target: Window | Document;
  private element?: HTMLElement;
  private onNext: () => void;
  private onPrev: () => void;
  private enabled: boolean;

  constructor(options: KeyboardBindingOptions & { element?: HTMLElement }) {
    this.target = options.target ?? window;
    this.element = options.element;
    this.onNext = options.onNext;
    this.onPrev = options.onPrev;
    this.enabled = options.enabled ?? true;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    
    if (this.element) {
      const rect = this.element.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const visiblePercentage = visibleHeight / rect.height;
      if (visiblePercentage < 0.5) return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.onPrev();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.onNext();
    }
  };

  attach() {
    this.target.addEventListener('keydown', this.handleKeyDown as EventListener);
  }

  detach() {
    this.target.removeEventListener('keydown', this.handleKeyDown as EventListener);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

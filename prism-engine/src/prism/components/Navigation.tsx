import React from 'react';

export interface NavigationProps {
  onPrev: () => void;
  onNext: () => void;
}

export function Navigation({ onPrev, onNext }: NavigationProps) {
  return (
    <div className="prism-nav">
      <button className="prism-nav-btn" aria-label="Previous card" onClick={onPrev}>
        ‹
      </button>
      <button className="prism-nav-btn" aria-label="Next card" onClick={onNext}>
        ›
      </button>
    </div>
  );
}

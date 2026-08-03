import React from 'react';

export interface IndicatorsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function Indicators({ count, activeIndex, onSelect }: IndicatorsProps) {
  return (
    <div className="prism-dots" role="tablist" aria-label="Card indicators">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          className={`prism-dot${i === activeIndex ? ' active' : ''}`}
          aria-label={`Go to card ${i + 1}`}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}

import React, { useRef } from 'react';
import { PrismItem } from '../types/Item';
import { PrismConfig } from '../types/Prism';
import { PrismEvents } from '../types/Events';
import { usePrismInteraction } from '../hooks/usePrismInteraction';
import { usePrismInput } from '../hooks/usePrismInput';
import { PrismCard } from './PrismCard';
import { Navigation } from './Navigation';
import { Indicators } from './Indicators';
import '../styles/prism.css';

export interface PrismProps {
  items: PrismItem[];
  activeIndex?: number;
  onChange?: (index: number) => void;
  renderCard?: (item: PrismItem, meta: { isActive: boolean; depth: number }) => React.ReactNode;
  config?: PrismConfig;
  events?: PrismEvents;
  showNavigation?: boolean;
  showIndicators?: boolean;
}

/**
 * <Prism items={items} activeIndex={i} onChange={setI} renderCard={...} config={...} />
 *
 * This is the ONLY file a consuming page should need to import from
 * prism/components. Everything else (geometry, animation, input) is
 * wired together internally.
 */
export function Prism({
  items,
  activeIndex,
  onChange,
  renderCard,
  config = {},
  events,
  showNavigation = true,
  showIndicators = true,
}: PrismProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const { state, cards, next, prev, goTo, onCardClick, onHover } = usePrismInteraction({
    items,
    config,
    events,
    activeIndex,
    onChange,
  });

  usePrismInput({
    stageRef,
    sceneRef,
    next,
    prev,
    isAnimating: () => state.animating,
    bindings: config.inputBindings,
  });

  return (
    <div className="prism-scene" ref={sceneRef}>
      <div
        className="prism-stage"
        ref={stageRef}
        style={{ perspective: config.perspective ?? 900 }}
        role="region"
        aria-label="prism"
      >
        <div className="prism-cylinder">
          {cards.map((geometry) => {
            const item = items[geometry.index];
            if (!item) return null;
            return (
              <PrismCard
                key={item.id}
                item={item}
                geometry={geometry}
                config={config}
                isActive={geometry.index === state.activeIndex}
                onClick={() => onCardClick(geometry.index)}
                onHoverStart={() => onHover(geometry.index)}
                onHoverEnd={() => onHover(null)}
                renderCard={renderCard}
              />
            );
          })}
        </div>
      </div>

      {showNavigation && <Navigation onPrev={prev} onNext={next} />}
      {showIndicators && <Indicators count={items.length} activeIndex={state.activeIndex} onSelect={goTo} />}
    </div>
  );
}

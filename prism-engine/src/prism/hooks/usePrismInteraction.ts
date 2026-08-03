import { useEffect, useRef, useState } from 'react';
import { PrismInteractionManager } from '../core/Controller';
import { PrismItem } from '../types/Item';
import { PrismConfig } from '../types/Prism';
import { PrismEvents } from '../types/Events';
import { PrismState } from '../core/State';
import { CardGeometry } from '../core/Geometry';

export interface UsePrismOptions {
  items: PrismItem[];
  config?: PrismConfig;
  events?: PrismEvents;
  activeIndex?: number;
  onChange?: (index: number) => void;
}

export function usePrismInteraction(options: UsePrismOptions) {
  const { items, config, events, activeIndex, onChange } = options;

  const controllerRef = useRef<PrismInteractionManager | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new PrismInteractionManager(items, config, activeIndex ?? 0);
  }
  const controller = controllerRef.current;

  const [state, setState] = useState<PrismState>(controller.state);
  const [cards, setCards] = useState<CardGeometry[]>(controller.getGeometryForFrame());

  useEffect(() => {
    controller.setItems(items);
    setCards(controller.getGeometryForFrame());
  }, [items, controller]);

  useEffect(() => {
    if (config) controller.setConfig(config);
    setCards(controller.getGeometryForFrame());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config), controller]);

  useEffect(() => {
    const unsubState = controller.emitter.on('stateChange', (s) => {
      setState(s);
      setCards(controller.getGeometryForFrame());
    });
    const unbindEvents = events ? controller.bindEvents(events) : () => {};
    const unsubActive = controller.emitter.on('activeChange', ({ index }) => {
      onChange?.(index);
    });

    return () => {
      unsubState();
      unbindEvents();
      unsubActive();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, events, onChange]);

  useEffect(() => {
    if (typeof activeIndex === 'number' && activeIndex !== state.activeIndex && !state.animating) {
      controller.goTo(activeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => () => controller.destroy(), [controller]);

  return {
    controller,
    state,
    cards,
    items,
    next: () => controller.next(),
    prev: () => controller.prev(),
    goTo: (i: number) => controller.goTo(i),
    onCardClick: (i: number) => controller.handleCardClick(i),
    onHover: (i: number | null) => controller.handleHover(i),
  };
}

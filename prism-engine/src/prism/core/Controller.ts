import { PrismState, createInitialState } from './State';
import { Geometry } from './Geometry';
import { Animator } from './Animator';
import { EventEmitter } from './EventEmitter';
import { shortestRotationSteps } from '../utils/math';
import { PrismItem } from '../types/Item';
import { PrismConfig, DEFAULT_CONFIG } from '../types/Prism';
import { PrismEvents } from '../types/Events';

type InternalEvents = {
  stateChange: PrismState;
  activeChange: { item: PrismItem; index: number };
  cardClick: { item: PrismItem; index: number };
  hover: { item: PrismItem | null; index: number | null };
  rotationStart: undefined;
  rotationEnd: undefined;
};

/**
 * Framework-agnostic engine. Knows nothing about React, Vue, DOM elements,
 * videos, audio, or any page content — only items, rotation, and events.
 * `usePrismInteraction` (React) wraps this; other frameworks can wrap it the same way.
 */
export class PrismInteractionManager {
  items: PrismItem[];
  config: PrismConfig & typeof DEFAULT_CONFIG;
  geometry: Geometry;
  state: PrismState;
  emitter = new EventEmitter<InternalEvents>();

  private animator: Animator;

  constructor(items: PrismItem[], config: PrismConfig = {}, initialIndex = 0) {
    this.items = items;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.geometry = new Geometry(items.length, this.config.radius, this.config.rotationStep);
    this.state = createInitialState(initialIndex);

    this.animator = new Animator(0, {
      damping: this.config.rotationDamping,
      onFrame: (rotation) => {
        this.state = { ...this.state, rotation, animating: true };
        this.emitter.emit('stateChange', this.state);
      },
      onStart: () => this.emitter.emit('rotationStart', undefined),
      onSettle: (rotation) => {
        this.state = { ...this.state, rotation, animating: false };
        this.emitter.emit('stateChange', this.state);
        this.emitter.emit('rotationEnd', undefined);
      },
    });
  }

  setItems(items: PrismItem[]) {
    this.items = items;
    this.geometry.update(items.length, this.config.radius, this.config.rotationStep);
  }

  setConfig(config: Partial<PrismConfig>) {
    this.config = { ...this.config, ...config };
    this.geometry.update(this.items.length, this.config.radius, this.config.rotationStep);
    this.animator.setDamping(this.config.rotationDamping);
  }

  getGeometryForFrame() {
    return this.geometry.computeAll(this.state.rotation);
  }

  next() {
    if (this.state.animating || this.items.length === 0) return;
    const activeIndex = (this.state.activeIndex + 1) % this.items.length;
    this.rotateTo(activeIndex, this.state.targetRotation - this.geometry.step);
  }

  prev() {
    if (this.state.animating || this.items.length === 0) return;
    const activeIndex = (this.state.activeIndex - 1 + this.items.length) % this.items.length;
    this.rotateTo(activeIndex, this.state.targetRotation + this.geometry.step);
  }

  goTo(index: number) {
    if (this.state.animating || index === this.state.activeIndex) return;
    const steps = shortestRotationSteps(this.state.activeIndex, index, this.items.length);
    this.rotateTo(index, this.state.targetRotation + steps * this.geometry.step);
  }

  handleCardClick(index: number) {
    const item = this.items[index];
    if (!item) return;
    this.emitter.emit('cardClick', { item, index });
    if (index !== this.state.activeIndex) this.goTo(index);
  }

  handleHover(index: number | null) {
    this.state = { ...this.state, hoveredIndex: index };
    const item = index !== null ? this.items[index] ?? null : null;
    this.emitter.emit('hover', { item, index });
  }

  /** Wires the public PrismEvents callbacks onto the internal emitter */
  bindEvents(events: PrismEvents): () => void {
    const unsubs: Array<() => void> = [];
    if (events.onActiveChange)
      unsubs.push(this.emitter.on('activeChange', ({ item, index }) => events.onActiveChange!(item, index)));
    if (events.onCardClick)
      unsubs.push(this.emitter.on('cardClick', ({ item, index }) => events.onCardClick!(item, index)));
    if (events.onHover)
      unsubs.push(this.emitter.on('hover', ({ item, index }) => events.onHover!(item, index)));
    if (events.onRotationStart)
      unsubs.push(this.emitter.on('rotationStart', () => events.onRotationStart!()));
    if (events.onRotationEnd)
      unsubs.push(this.emitter.on('rotationEnd', () => events.onRotationEnd!()));
    return () => unsubs.forEach((u) => u());
  }

  private rotateTo(activeIndex: number, targetRotation: number) {
    this.state = { ...this.state, activeIndex, targetRotation, animating: true };
    this.emitter.emit('stateChange', this.state);

    const item = this.items[activeIndex];
    this.emitter.emit('activeChange', { item, index: activeIndex });

    this.animator.animateTo(targetRotation);
  }

  destroy() {
    this.animator.destroy();
    this.emitter.clear();
  }
}

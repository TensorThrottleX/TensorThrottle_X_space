export interface PrismState {
  activeIndex: number;
  rotation: number;
  targetRotation: number;
  animating: boolean;
  hoveredIndex: number | null;
}

export function createInitialState(activeIndex = 0): PrismState {
  return {
    activeIndex,
    rotation: 0,
    targetRotation: 0,
    animating: false,
    hoveredIndex: null,
  };
}

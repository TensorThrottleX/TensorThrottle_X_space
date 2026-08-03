export interface InputBindings {
  keyboard?: boolean;
  wheel?: boolean;
  touch?: boolean;
  wheelCooldownMs?: number;
  swipeThresholdPx?: number;
}

export interface PrismConfig {
  /** Cylinder radius in px. Original demo value: 260 */
  radius?: number;
  /** CSS perspective in px. Original demo value: 900 */
  perspective?: number;
  /** Reserved for future partial-arc layouts. Full circle = 360 */
  visibleAngle?: number;
  cardWidth?: number;
  cardHeight?: number;
  /** Reserved for duration-based easing implementations */
  animationDuration?: number;
  /** Exponential-ease damping factor. Original demo value: 0.095 */
  rotationDamping?: number;
  /** Angular gap between cards in radians. 0 = auto (2π / itemCount) */
  rotationStep?: number;
  scaleCurve?: (depth: number) => number;
  opacityCurve?: (depth: number) => number;
  inputBindings?: InputBindings;
}

export const DEFAULT_CONFIG: Required<
  Pick<
    PrismConfig,
    'radius' | 'perspective' | 'visibleAngle' | 'cardWidth' | 'cardHeight' |
    'animationDuration' | 'rotationDamping' | 'rotationStep'
  >
> = {
  radius: 260,
  perspective: 900,
  visibleAngle: 360,
  cardWidth: 220,
  cardHeight: 300,
  animationDuration: 600,
  rotationDamping: 0.095,
  rotationStep: 0,
};

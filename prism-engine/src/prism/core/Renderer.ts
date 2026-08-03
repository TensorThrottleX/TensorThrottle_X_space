import type { CSSProperties } from 'react';
import { CardGeometry } from './Geometry';
import { resolveCurves } from '../utils/interpolation';
import { PrismConfig } from '../types/Prism';

export interface CardVisualStyle {
  transform: string;
  opacity: number;
  zIndex: number;
  pointerEvents: CSSProperties['pointerEvents'];
  filter: string;
  boxShadow: string;
}

/**
 * Turns geometry into a plain style object. It never touches the DOM
 * directly — components decide how to apply it (React style props here,
 * but the same math works for Vue/Svelte/vanilla consumers too).
 */
export class Renderer {
  static computeStyle(geometry: CardGeometry, config: PrismConfig): CardVisualStyle {
    const { scaleCurve, opacityCurve } = resolveCurves(config);
    const scale = scaleCurve(geometry.depth);
    const opacity = opacityCurve(geometry.depth);
    const zIndex = Math.round(geometry.depth * 100);

    let filter = '';
    if (geometry.depth < 0.82) {
      const brightness = 0.55 + geometry.depth * 0.55;
      filter = `brightness(${brightness.toFixed(3)})`;
    }

    const boxShadow =
      geometry.depth > 0.88
        ? '0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)'
        : '';

    return {
      transform: `translateX(${geometry.x}px) translateZ(${geometry.z}px) rotateY(${geometry.rotY}deg) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: opacity < 0.25 ? 'none' : 'auto',
      filter,
      boxShadow,
    };
  }
}

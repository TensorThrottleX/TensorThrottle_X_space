import { PrismConfig } from '../types/Prism';

/** Original demo: 0.58 + depth * 0.44 */
export function defaultScaleCurve(depth: number): number {
  return 0.58 + depth * 0.44;
}

/** Original demo: fades in from rear hemisphere, ramps up toward front */
export function defaultOpacityCurve(depth: number): number {
  if (depth < 0.08) return 0;
  if (depth < 0.22) return (depth - 0.08) / 0.14;
  return 0.45 + depth * 0.55;
}

export function resolveCurves(config: PrismConfig) {
  return {
    scaleCurve: config.scaleCurve ?? defaultScaleCurve,
    opacityCurve: config.opacityCurve ?? defaultOpacityCurve,
  };
}

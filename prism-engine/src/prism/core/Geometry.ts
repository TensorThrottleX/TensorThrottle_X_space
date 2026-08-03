import { angleForIndex, cylindricalPosition, depthFromTheta, TWO_PI } from '../utils/math';

export interface CardGeometry {
  index: number;
  theta: number;
  x: number;
  z: number;
  rotY: number;
  depth: number;
}

/**
 * Pure geometry — no DOM, no React. Given how many cards exist and where the
 * cylinder currently sits, it tells you where every card is in 3D space.
 */
export class Geometry {
  radius: number;
  step: number;
  itemCount: number;

  constructor(itemCount: number, radius: number, stepOverride?: number) {
    this.itemCount = itemCount;
    this.radius = radius;
    this.step = stepOverride && stepOverride > 0 ? stepOverride : TWO_PI / Math.max(itemCount, 1);
  }

  update(itemCount: number, radius: number, stepOverride?: number) {
    this.itemCount = itemCount;
    this.radius = radius;
    this.step = stepOverride && stepOverride > 0 ? stepOverride : TWO_PI / Math.max(itemCount, 1);
  }

  computeCard(index: number, cylinderRotation: number): CardGeometry {
    const offset = angleForIndex(index, this.step);
    const theta = offset + cylinderRotation;
    const { x, z, rotY } = cylindricalPosition(theta, this.radius);
    const depth = depthFromTheta(theta);
    return { index, theta, x, z, rotY, depth };
  }

  computeAll(cylinderRotation: number): CardGeometry[] {
    const result: CardGeometry[] = [];
    for (let i = 0; i < this.itemCount; i++) {
      result.push(this.computeCard(i, cylinderRotation));
    }
    return result;
  }
}

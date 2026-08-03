export const TWO_PI = Math.PI * 2;

export function angleForIndex(index: number, step: number): number {
  return index * step;
}

/** cos(θ) normalised to [0,1] — 1 = facing viewer, 0 = directly behind */
export function depthFromTheta(theta: number): number {
  const cosTheta = Math.cos(theta);
  return (cosTheta + 1) / 2;
}

/** Shortest angular path (in step units) between two indices on the ring */
export function shortestRotationSteps(fromIndex: number, toIndex: number, count: number): number {
  const fwd = ((toIndex - fromIndex) + count) % count;
  const back = count - fwd;
  return fwd <= back ? -fwd : back;
}

export function cylindricalPosition(theta: number, radius: number) {
  return {
    x: radius * Math.sin(theta),
    z: radius * Math.cos(theta),
    rotY: theta * (180 / Math.PI),
  };
}

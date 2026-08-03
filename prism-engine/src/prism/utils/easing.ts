export function dampedApproach(current: number, target: number, damping: number): number {
  return current + (target - current) * damping;
}

export function isSettled(current: number, target: number, epsilon = 0.0004): boolean {
  return Math.abs(target - current) < epsilon;
}

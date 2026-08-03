import { useEffect } from 'react';
import { KeyboardInput } from '../input/Keyboard';
import { MouseInput } from '../input/Mouse';
import { TouchInput } from '../input/Touch';
import { InputBindings } from '../types/Prism';

export interface UsePrismInputOptions {
  stageRef: React.RefObject<any>;
  sceneRef?: React.RefObject<any>;
  next: () => void;
  prev: () => void;
  isAnimating: () => boolean;
  bindings?: InputBindings;
}

export function usePrismInput(options: UsePrismInputOptions) {
  const { stageRef, sceneRef, next, prev, isAnimating, bindings = {} } = options;
  const {
    keyboard = true,
    wheel = true,
    touch = true,
    wheelCooldownMs = 650,
    swipeThresholdPx = 38,
  } = bindings;

  useEffect(() => {
    const disposers: Array<() => void> = [];

    if (keyboard) {
      const kb = new KeyboardInput({ onNext: next, onPrev: prev });
      kb.attach();
      disposers.push(() => kb.detach());
    }

    if (wheel && stageRef.current) {
      const mouse = new MouseInput({
        element: stageRef.current,
        onNext: next,
        onPrev: prev,
        isAnimating,
        cooldownMs: wheelCooldownMs,
      });
      mouse.attach();
      disposers.push(() => mouse.detach());
    }

    const touchTarget = sceneRef?.current ?? stageRef.current;
    if (touch && touchTarget) {
      const touchInput = new TouchInput({
        element: touchTarget,
        onNext: next,
        onPrev: prev,
        isAnimating,
        swipeThresholdPx,
      });
      touchInput.attach();
      disposers.push(() => touchInput.detach());
    }

    return () => disposers.forEach((d) => d());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef.current, sceneRef?.current, keyboard, wheel, touch, wheelCooldownMs, swipeThresholdPx]);
}

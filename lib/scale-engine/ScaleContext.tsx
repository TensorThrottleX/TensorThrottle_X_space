'use client';

/**
 * SCALE ENGINE — React Context
 * 
 * Provides scale state to any component that needs it.
 * Components can read current scale, device type, etc.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ScaleConfig, ScaleState, DeviceType } from './types';
import { DEFAULT_SCALE_CONFIG } from './config';

// ═══════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════

const ScaleContext = createContext<ScaleState | null>(null);

export function useScaleContext(): ScaleState {
  const context = useContext(ScaleContext);
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      scale: 1,
      rawScale: 1,
      isClamped: false,
      deviceType: 'desktop',
      viewportWidth: 1920,
      isActive: false,
    };
  }
  return context;
}

// ═══════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════

interface ScaleProviderProps {
  children: React.ReactNode;
  config?: Partial<ScaleConfig>;
}

export function ScaleProvider({ children, config: configOverrides }: ScaleProviderProps) {
  const config: ScaleConfig = { ...DEFAULT_SCALE_CONFIG, ...configOverrides };

  const [state, setState] = useState<ScaleState>({
    scale: 1,
    rawScale: 1,
    isClamped: false,
    deviceType: 'desktop',
    viewportWidth: 1920,
    isActive: config.enabled,
  });

  const calculateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;

    // Determine device type
    let deviceType: DeviceType = 'desktop';
    if (viewportWidth < config.breakpoints.mobile) {
      deviceType = 'mobile';
    } else if (viewportWidth < config.breakpoints.tablet) {
      deviceType = 'tablet';
    } else if (viewportWidth > config.breakpoints.ultrawide) {
      deviceType = 'ultrawide';
    }

    // Calculate raw scale
    const rawScale = viewportWidth / config.designWidth;

    // Apply desktop lock if enabled
    let scale = rawScale;
    if (config.lockOnDesktop && viewportWidth >= config.desktopLockThreshold) {
      scale = 1;
    } else if (config.enabled) {
      // Apply min/max clamping
      scale = Math.min(config.maxScale, Math.max(config.minScale, rawScale));
    }

    const isClamped = scale !== rawScale;

    setState({
      scale,
      rawScale,
      isClamped,
      deviceType,
      viewportWidth,
      isActive: config.enabled,
    });
  }, [config]);

  useEffect(() => {
    calculateState();
    window.addEventListener('resize', calculateState);
    return () => window.removeEventListener('resize', calculateState);
  }, [calculateState]);

  return (
    <ScaleContext.Provider value={state}>
      {children}
    </ScaleContext.Provider>
  );
}

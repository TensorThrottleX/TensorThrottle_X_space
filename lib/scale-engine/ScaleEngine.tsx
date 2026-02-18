'use client';

/**
 * SCALE ENGINE — Main Component
 * 
 * Drop-in replacement for RenderScaler.
 * Wraps children in a scaled container.
 * 
 * USAGE:
 * <ScaleEngine>
 *   <YourApp />
 * </ScaleEngine>
 * 
 * WITH CONFIG:
 * <ScaleEngine config={{ minScale: 0.5, maxScale: 1.0 }}>
 *   <YourApp />
 * </ScaleEngine>
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ScaleConfig, DeviceType } from './types';
import { DEFAULT_SCALE_CONFIG } from './config';
import { ScaleProvider } from './ScaleContext';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface ScaleEngineProps {
  children: React.ReactNode;
  config?: Partial<ScaleConfig>;
  /** Optional className for the root container */
  className?: string;
  /** Optional ID for debugging */
  id?: string;
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export function ScaleEngine({ 
  children, 
  config: configOverrides,
  className = '',
  id = 'scale-engine-root',
}: ScaleEngineProps) {
  // Merge config with defaults
  const config: ScaleConfig = { ...DEFAULT_SCALE_CONFIG, ...configOverrides };

  // State
  const [scale, setScale] = useState(1);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isReady, setIsReady] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────
  // SCALE CALCULATION
  // ─────────────────────────────────────────────────────
  const calculateScale = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;

    // Device type detection
    let newDeviceType: DeviceType = 'desktop';
    if (viewportWidth < config.breakpoints.mobile) {
      newDeviceType = 'mobile';
    } else if (viewportWidth < config.breakpoints.tablet) {
      newDeviceType = 'tablet';
    } else if (viewportWidth > config.breakpoints.ultrawide) {
      newDeviceType = 'ultrawide';
    }
    setDeviceType(newDeviceType);

    // Skip scaling if disabled
    if (!config.enabled) {
      setScale(1);
      return;
    }

    // Calculate raw scale
    const rawScale = viewportWidth / config.designWidth;

    // Apply desktop lock
    if (config.lockOnDesktop && viewportWidth >= config.desktopLockThreshold) {
      setScale(1);
      return;
    }

    // Apply clamping
    const clampedScale = Math.min(
      config.maxScale,
      Math.max(config.minScale, rawScale)
    );

    setScale(clampedScale);
  }, [config]);

  // ─────────────────────────────────────────────────────
  // HEIGHT SYNCHRONIZATION
  // ─────────────────────────────────────────────────────
  const syncHeight = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    
    // Get the unscaled content height and multiply by scale
    const contentHeight = contentRef.current.offsetHeight;
    const scaledHeight = contentHeight * scale;
    
    containerRef.current.style.height = `${scaledHeight}px`;
  }, [scale]);

  // ─────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────

  // Initial calculation + resize listener
  useEffect(() => {
    calculateScale();
    setIsReady(true);

    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [calculateScale]);

  // Sync height when scale changes
  useEffect(() => {
    syncHeight();
  }, [scale, syncHeight]);

  // Observe content size changes
  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver(() => {
      syncHeight();
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [syncHeight]);

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  // Pre-render state (prevents flash)
  if (!isReady) {
    return (
      <div style={{ visibility: 'hidden', minHeight: '100vh' }}>
        {children}
      </div>
    );
  }

  return (
    <ScaleProvider config={configOverrides}>
      <div
        ref={containerRef}
        id={id}
        className={`scale-engine-container ${className}`}
        data-device={deviceType}
        data-scale={scale.toFixed(3)}
        style={{
          width: '100%',
          overflowX: 'hidden',
          overflowY: 'visible',
          position: 'relative',
        }}
      >
        <div
          ref={contentRef}
          className="scale-engine-content"
          style={{
            width: `${config.designWidth}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            minHeight: '100vh',
          }}
        >
          {children}
        </div>
      </div>
    </ScaleProvider>
  );
}

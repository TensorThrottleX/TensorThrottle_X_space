/**
 * SCALE ENGINE — Default Configuration
 * 
 * Modify these values to change scaling behavior globally.
 * These are the ONLY values you need to tune.
 */

import type { ScaleConfig } from './types';

export const DEFAULT_SCALE_CONFIG: ScaleConfig = {
  // ═══════════════════════════════════════════════════════
  // DESIGN REFERENCE
  // ═══════════════════════════════════════════════════════
  /** 
   * The width your UI was designed for.
   * All content renders at this width, then scales to fit.
   */
  designWidth: 1920,

  // ═══════════════════════════════════════════════════════
  // ZOOM LIMITS
  // ═══════════════════════════════════════════════════════
  /**
   * Minimum zoom level (0.35 = 35%)
   * Prevents text from becoming unreadable on small phones.
   * At 360px viewport: rawScale = 0.1875 → clamped to 0.35
   */
  minScale: 0.35,

  /**
   * Maximum zoom level (1.25 = 125%)
   * Prevents elements from becoming oversized on 4K monitors.
   * At 2560px viewport: rawScale = 1.33 → clamped to 1.25
   */
  maxScale: 1.25,

  // ═══════════════════════════════════════════════════════
  // DEVICE BREAKPOINTS
  // ═══════════════════════════════════════════════════════
  breakpoints: {
    mobile: 480,      // < 480px = mobile
    tablet: 768,      // < 768px = tablet
    ultrawide: 2560,  // > 2560px = ultrawide
  },

  // ═══════════════════════════════════════════════════════
  // BEHAVIOR FLAGS
  // ═══════════════════════════════════════════════════════
  /**
   * Master switch to enable/disable the entire scaling system.
   * Set to false to bypass all scaling (useful for debugging).
   */
  enabled: true,

  /**
   * When true, scale is locked to 1.0 on screens wider than desktopLockThreshold.
   * This means desktop users see the UI at exactly 1920px, no scaling.
   */
  lockOnDesktop: false,

  /**
   * Width threshold for the lockOnDesktop feature.
   * Only applies if lockOnDesktop is true.
   */
  desktopLockThreshold: 1920,
};

/**
 * PRESET CONFIGURATIONS
 * Use these for common scenarios.
 */

/** Strict scaling - never goes below 50% or above 100% */
export const STRICT_SCALE_CONFIG: Partial<ScaleConfig> = {
  minScale: 0.5,
  maxScale: 1.0,
};

/** Mobile-first - optimized for small screens */
export const MOBILE_FIRST_CONFIG: Partial<ScaleConfig> = {
  designWidth: 1280,
  minScale: 0.4,
  maxScale: 1.5,
};

/** Desktop-locked - no scaling on desktop, only on mobile */
export const DESKTOP_LOCKED_CONFIG: Partial<ScaleConfig> = {
  lockOnDesktop: true,
  desktopLockThreshold: 1440,
  minScale: 0.3,
};

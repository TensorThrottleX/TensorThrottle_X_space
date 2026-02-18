/**
 * SCALE ENGINE — Type Definitions
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'ultrawide';

export interface ScaleBreakpoints {
  /** Below this width = mobile (default: 480) */
  mobile: number;
  /** Below this width = tablet (default: 768) */
  tablet: number;
  /** Below this width = desktop, above = ultrawide (default: 2560) */
  ultrawide: number;
}

export interface ScaleConfig {
  /** The reference design width (default: 1920) */
  designWidth: number;
  
  /** Minimum scale factor - prevents UI from becoming unreadable (default: 0.35) */
  minScale: number;
  
  /** Maximum scale factor - prevents UI from becoming oversized (default: 1.25) */
  maxScale: number;
  
  /** Device breakpoint thresholds */
  breakpoints: ScaleBreakpoints;
  
  /** Enable/disable the scaling system entirely (default: true) */
  enabled: boolean;
  
  /** Lock scale to 1.0 on desktop-sized screens (default: false) */
  lockOnDesktop: boolean;
  
  /** Desktop width threshold for lockOnDesktop feature */
  desktopLockThreshold: number;
}

export interface ScaleState {
  /** Current computed scale factor */
  scale: number;
  
  /** Raw scale before clamping */
  rawScale: number;
  
  /** Whether scale is being clamped */
  isClamped: boolean;
  
  /** Current device classification */
  deviceType: DeviceType;
  
  /** Current viewport width */
  viewportWidth: number;
  
  /** Whether the engine is active */
  isActive: boolean;
}

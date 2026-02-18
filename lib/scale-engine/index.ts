/**
 * SCALE ENGINE — Standalone Viewport Scaling System
 * 
 * This module is 100% isolated. It handles:
 * - Fixed-width design scaling to any viewport
 * - Min/Max zoom clamping
 * - Device type detection
 * - Height synchronization
 * 
 * DOES NOT TOUCH:
 * - Fonts (uses whatever CSS defines)
 * - Colors (uses whatever CSS defines)
 * - Layout structure (just wraps children)
 * 
 * INTEGRATION:
 * - Replace RenderScaler import with ScaleEngine
 * - Pass config object for customization
 */

export { ScaleEngine } from './ScaleEngine';
export { useScaleContext, ScaleProvider } from './ScaleContext';
export type { ScaleConfig, ScaleState, DeviceType } from './types';
export { DEFAULT_SCALE_CONFIG } from './config';

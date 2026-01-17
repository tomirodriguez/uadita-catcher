// config/accessibilityConfig.ts

import type { ColorScheme } from '../utils/storage'

/**
 * Color palettes optimized for different types of color vision.
 * Based on accessibility guidelines for color blindness.
 */
export const COLOR_SCHEMES: Record<ColorScheme, { good: string; bad: string }> = {
  default: {
    good: '#22c55e', // Green
    bad: '#ef4444', // Red
  },
  deuteranopia: {
    good: '#3b82f6', // Blue
    bad: '#f97316', // Orange
  },
  protanopia: {
    good: '#06b6d4', // Cyan
    bad: '#eab308', // Yellow
  },
}

/**
 * Gets the appropriate color for a given color scheme and type.
 */
export function getColorForScheme(
  scheme: ColorScheme,
  type: 'good' | 'bad'
): string {
  return COLOR_SCHEMES[scheme][type]
}

/**
 * Accessibility configuration constants.
 */
export const ACCESSIBILITY_CONFIG = {
  // Minimum font sizes for accessibility
  minFontSize: 18,
  minTouchTarget: 48,

  // Minimum contrast ratio for text
  minContrastRatio: 4.5,

  // Reduced motion settings
  reducedMotion: {
    disableScreenShake: true,
    disableParticles: true,
    simplifyAnimations: true,
  },
}

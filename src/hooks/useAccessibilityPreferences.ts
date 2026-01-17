// hooks/useAccessibilityPreferences.ts

import { useState, useCallback, useSyncExternalStore } from 'react'
import { getSettings, updateSettings } from '../utils/storage'
import type { ColorScheme } from '../utils/storage'

/**
 * Gets the current system reduced motion preference.
 */
function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Server-side snapshot for reduced motion (always false).
 */
function getReducedMotionServerSnapshot(): boolean {
  return false
}

/**
 * Subscribe to reduced motion preference changes.
 */
function subscribeReducedMotion(callback: () => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

/**
 * Hook for managing accessibility preferences.
 *
 * Features:
 * - Detects system prefers-reduced-motion preference
 * - Manages color scheme for color blindness support
 * - Persists settings to localStorage
 * - Listens for system preference changes
 */
export function useAccessibilityPreferences() {
  // Use useSyncExternalStore for system preference to avoid setState in effect
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(() => {
    const settings = getSettings()
    return settings.reducedMotion
  })

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const settings = getSettings()
    return settings.colorScheme
  })

  // Update reduced motion setting
  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionEnabled(enabled)
    updateSettings({ reducedMotion: enabled })
  }, [])

  // Update color scheme setting
  const updateColorScheme = useCallback((scheme: ColorScheme) => {
    setColorScheme(scheme)
    updateSettings({ colorScheme: scheme })
  }, [])

  // Effective reduced motion: true if either system or user preference is enabled
  const effectiveReducedMotion = prefersReducedMotion || reducedMotionEnabled

  return {
    // System preference (read-only)
    prefersReducedMotion,

    // User setting
    reducedMotionEnabled,
    setReducedMotion,

    // Effective setting (system OR user preference)
    effectiveReducedMotion,

    // Color scheme
    colorScheme,
    setColorScheme: updateColorScheme,
  }
}

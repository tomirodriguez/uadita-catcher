// components/Settings/AccessibilitySettings.tsx

import { useCallback } from 'react'
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences'
import { getColorForScheme } from '../../config/accessibilityConfig'
import type { ColorScheme } from '../../utils/storage'

interface AccessibilitySettingsProps {
  onClose?: () => void
}

const COLOR_SCHEME_OPTIONS: { value: ColorScheme; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Standard color palette' },
  { value: 'deuteranopia', label: 'Deuteranopia', description: 'Red-green color blindness (most common)' },
  { value: 'protanopia', label: 'Protanopia', description: 'Red-green color blindness (reduced red)' },
]

/**
 * Accessibility settings panel with color scheme selector and reduced motion toggle.
 *
 * Features:
 * - Color scheme selector for color blindness support (Default, Deuteranopia, Protanopia)
 * - Reduced motion toggle that respects system preferences
 * - Settings persist to localStorage
 * - Accessible keyboard navigation and ARIA labels
 */
export function AccessibilitySettings({ onClose }: AccessibilitySettingsProps) {
  const {
    prefersReducedMotion,
    reducedMotionEnabled,
    setReducedMotion,
    colorScheme,
    setColorScheme,
  } = useAccessibilityPreferences()

  const handleColorSchemeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setColorScheme(e.target.value as ColorScheme)
    },
    [setColorScheme]
  )

  const handleReducedMotionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setReducedMotion(e.target.checked)
    },
    [setReducedMotion]
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px',
        background: 'rgba(26, 26, 46, 0.95)',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      role="region"
      aria-label="Accessibility settings"
    >
      <style>
        {`
          .accessibility-select:focus-visible,
          .accessibility-toggle:focus-visible {
            outline: 3px solid #60a5fa;
            outline-offset: 2px;
          }
          .accessibility-select:hover {
            border-color: #60a5fa;
          }
          .accessibility-toggle-switch {
            transition: background-color 200ms ease;
          }
          .accessibility-toggle:checked + .accessibility-toggle-switch {
            background-color: #22c55e;
          }
          .accessibility-toggle:checked + .accessibility-toggle-switch::after {
            transform: translateX(20px);
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
          }}
        >
          Accessibility
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            aria-label="Close accessibility settings"
          >
            Close
          </button>
        )}
      </div>

      {/* Color Scheme Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          htmlFor="color-scheme-select"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#ffffff',
          }}
        >
          Color Scheme
        </label>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.4,
          }}
        >
          Choose a color palette optimized for different types of color vision
        </p>
        <select
          id="color-scheme-select"
          className="accessibility-select"
          value={colorScheme}
          onChange={handleColorSchemeChange}
          style={{
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 500,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '40px',
          }}
          aria-describedby="color-scheme-description"
        >
          {COLOR_SCHEME_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              style={{
                background: '#1a1a2e',
                color: '#ffffff',
              }}
            >
              {option.label}
            </option>
          ))}
        </select>
        <p
          id="color-scheme-description"
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic',
          }}
        >
          {COLOR_SCHEME_OPTIONS.find((o) => o.value === colorScheme)?.description}
        </p>
      </div>

      {/* Reduced Motion Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              htmlFor="reduced-motion-toggle"
              style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Reduce Animations
            </label>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.4,
              }}
            >
              Disables screen shake and simplifies animations
            </p>
          </div>

          {/* Custom Toggle Switch */}
          <div style={{ position: 'relative', width: '48px', height: '28px', flexShrink: 0 }}>
            <input
              type="checkbox"
              id="reduced-motion-toggle"
              className="accessibility-toggle"
              checked={reducedMotionEnabled}
              onChange={handleReducedMotionChange}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                margin: 0,
                zIndex: 1,
              }}
              aria-describedby="reduced-motion-description"
            />
            <div
              className="accessibility-toggle-switch"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: reducedMotionEnabled ? '#22c55e' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '14px',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  transform: reducedMotionEnabled ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 200ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* System preference indicator */}
        {prefersReducedMotion && (
          <p
            id="reduced-motion-description"
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#60a5fa',
              }}
            />
            Your system prefers reduced motion
          </p>
        )}
      </div>

      {/* Color Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          Color Preview
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <ColorPreviewBox
            label="Good"
            color={getColorForScheme(colorScheme, 'good')}
          />
          <ColorPreviewBox
            label="Bad"
            color={getColorForScheme(colorScheme, 'bad')}
          />
        </div>
      </div>
    </div>
  )
}

interface ColorPreviewBoxProps {
  label: string
  color: string
}

function ColorPreviewBox({ label, color }: ColorPreviewBoxProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        flex: 1,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '40px',
          backgroundColor: color,
          borderRadius: '8px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
        aria-label={`${label} items color: ${color}`}
      />
      <span
        style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

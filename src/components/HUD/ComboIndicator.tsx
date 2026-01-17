// components/HUD/ComboIndicator.tsx

interface ComboIndicatorProps {
  comboCount: number
  multiplier: number
  timerPercent: number
}

/**
 * Displays the current combo count, multiplier, and a timer bar.
 * Positioned below the score display (top-left).
 * Only visible when combo count is greater than 0.
 * Respects safe-area-inset-top for devices with notches.
 */
export function ComboIndicator({
  comboCount,
  multiplier,
  timerPercent,
}: ComboIndicatorProps) {
  // Don't render when there's no active combo
  if (comboCount <= 0) {
    return null
  }

  // Determine color based on multiplier level
  const getMultiplierColor = () => {
    if (multiplier >= 5) return '#ff00ff' // Purple for 5x
    if (multiplier >= 3) return '#ff6600' // Orange for 3x
    if (multiplier >= 2) return '#ffcc00' // Gold for 2x
    if (multiplier >= 1.5) return '#00ccff' // Cyan for 1.5x
    return '#ffffff' // White for 1x
  }

  const color = getMultiplierColor()

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(max(16px, env(safe-area-inset-top)) + 62px)',
        left: 'max(16px, env(safe-area-inset-left))',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Combo count and multiplier text */}
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: color,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          marginBottom: '4px',
        }}
      >
        {comboCount}x COMBO
        {multiplier > 1 && (
          <span style={{ marginLeft: '8px', fontSize: '16px' }}>
            ({multiplier}x)
          </span>
        )}
      </div>

      {/* Timer bar */}
      <div
        style={{
          width: '100px',
          height: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${timerPercent * 100}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '3px',
            transition: 'width 50ms linear',
          }}
        />
      </div>
    </div>
  )
}

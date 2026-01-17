// components/HUD/LivesDisplay.tsx

interface LivesDisplayProps {
  lives: number
  maxLives: number
  isInvulnerable?: boolean
}

/**
 * Displays current lives as heart icons in the top-right corner.
 * Shows filled hearts for remaining lives and empty hearts for lost lives.
 * Hearts flash when player is invulnerable.
 * Respects safe-area-inset-top for devices with notches.
 */
export function LivesDisplay({
  lives,
  maxLives,
  isInvulnerable = false,
}: LivesDisplayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(16px, env(safe-area-inset-top))',
        right: 'max(16px, env(safe-area-inset-right))',
        display: 'flex',
        gap: '4px',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        animation: isInvulnerable ? 'flash 200ms infinite' : undefined,
      }}
    >
      <style>
        {`
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
      {Array.from({ length: maxLives }).map((_, index) => (
        <span
          key={index}
          style={{
            fontSize: '24px',
            filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))',
          }}
          role="img"
          aria-label={index < lives ? 'vida restante' : 'vida perdida'}
        >
          {index < lives ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  )
}

// components/HUD/ScoreDisplay.tsx

interface ScoreDisplayProps {
  score: number
}

/**
 * Displays the current score in the top-left corner of the screen.
 * Respects safe-area-inset-top for devices with notches.
 * Font size is 24px for legibility.
 */
export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(16px, env(safe-area-inset-top))',
        left: 'max(16px, env(safe-area-inset-left))',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '24px',
        fontWeight: 700,
        color: '#ffffff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      Score: {score.toLocaleString()}
    </div>
  )
}

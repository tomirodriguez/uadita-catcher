// components/HUD/ScoreDisplay.tsx

import { DIFFICULTY_CONFIG } from '../../config/gameConfig'

interface ScoreDisplayProps {
  score: number
}

/**
 * Calculates points needed to reach the next level.
 * Returns null if already at max level.
 */
function getPointsToNextLevel(score: number): number | null {
  const internalLevel = Math.floor(score / DIFFICULTY_CONFIG.scorePerLevel)

  // Check if at max level (internal level is 0-indexed, maxLevel is count)
  if (internalLevel >= DIFFICULTY_CONFIG.maxLevel - 1) {
    return null
  }

  const nextLevelScore = (internalLevel + 1) * DIFFICULTY_CONFIG.scorePerLevel
  return nextLevelScore - score
}

/**
 * Displays the current score in the top-left corner of the screen.
 * Also shows points needed to reach the next level.
 * Respects safe-area-inset-top for devices with notches.
 * Font size is 24px for legibility.
 */
export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const pointsToNext = getPointsToNextLevel(score)

  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(16px, env(safe-area-inset-top))',
        left: 'max(16px, env(safe-area-inset-left))',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#ffffff',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        Puntaje: {score.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#aaaaaa',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
          marginTop: '2px',
        }}
      >
        {pointsToNext !== null
          ? `Siguiente nivel: ${pointsToNext} pts`
          : 'Nivel máximo'}
      </div>
    </div>
  )
}

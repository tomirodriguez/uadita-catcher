// components/HUD/DebugPanel.tsx

import type { DifficultyState } from '../../types/game'

interface DebugPanelProps {
  difficulty: DifficultyState
  score: number
  elapsedTime: number
}

/**
 * Debug panel to display game stats in development mode.
 * Shows difficulty progression values in real-time.
 */
export function DebugPanel({ difficulty, score, elapsedTime }: DebugPanelProps) {
  // Only render in development
  if (import.meta.env.PROD) return null

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#00ff00',
        padding: '10px 14px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.6,
        zIndex: 1000,
        border: '1px solid #00ff0044',
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#ffcc00' }}>
        🛠 DEBUG
      </div>
      <div>
        <span style={{ color: '#888' }}>Tiempo:</span> {formatTime(elapsedTime)}
      </div>
      <div>
        <span style={{ color: '#888' }}>Score:</span> {score}
      </div>
      <div style={{ borderTop: '1px solid #333', marginTop: 6, paddingTop: 6 }}>
        <span style={{ color: '#888' }}>Nivel:</span>{' '}
        <span style={{ color: '#ff6600' }}>{difficulty.level}</span> / 25
      </div>
      <div>
        <span style={{ color: '#888' }}>Velocidad:</span>{' '}
        <span style={{ color: '#66ccff' }}>{Math.round(difficulty.fallSpeed)}</span> px/s
      </div>
      <div>
        <span style={{ color: '#888' }}>Spawn:</span>{' '}
        <span style={{ color: '#66ccff' }}>{Math.round(difficulty.spawnInterval)}</span> ms
      </div>
      <div>
        <span style={{ color: '#888' }}>Bad ratio:</span>{' '}
        <span style={{ color: '#ff6666' }}>{(difficulty.badItemRatio * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

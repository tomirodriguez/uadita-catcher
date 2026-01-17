// components/Menu/GameOverScreen.tsx

import { useEffect, useState, useCallback, useRef } from 'react'
import { soundManager } from '../../audio/SoundManager'

interface GameOverScreenProps {
  score: number
  highScore: number
  isNewHighScore: boolean
  onPlayAgain: () => void
  onMainMenu: () => void
}

/**
 * Game over screen displaying final score, high score indicator,
 * and options to play again or return to main menu.
 * Features entrance animation and accessible button sizing.
 */
export function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onMainMenu,
}: GameOverScreenProps) {
  const [isVisible, setIsVisible] = useState(false)
  const hasPLayedSoundsRef = useRef(false)

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Play game over sounds when component mounts
  useEffect(() => {
    if (hasPLayedSoundsRef.current) return
    hasPLayedSoundsRef.current = true

    // Stop any playing music with quick fade
    soundManager.stopMusic(500)

    // Play game over sound
    soundManager.play('gameOver')

    // If new high score, play high score sound after a short delay
    if (isNewHighScore) {
      const timer = setTimeout(() => {
        soundManager.play('highScore')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isNewHighScore])

  // Play click sound and trigger action
  const handlePlayAgain = useCallback(() => {
    soundManager.play('click')
    onPlayAgain()
  }, [onPlayAgain])

  const handleMainMenu = useCallback(() => {
    soundManager.play('click')
    onMainMenu()
  }, [onMainMenu])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 400ms ease-out, transform 400ms ease-out',
      }}
    >
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4); }
            50% { text-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6); }
          }
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .game-over-button:hover {
            transform: scale(1.05);
          }
          .game-over-button:active {
            transform: scale(0.98);
          }
          .game-over-button:focus-visible {
            outline: 3px solid #ffffff;
            outline-offset: 3px;
          }
          .play-again-button:hover {
            background: linear-gradient(180deg, #e94560 0%, #c23a51 100%) !important;
          }
          .main-menu-button:hover {
            background: rgba(255, 255, 255, 0.2) !important;
          }
        `}
      </style>

      {/* Game Over Title */}
      <h1
        style={{
          fontSize: 'clamp(40px, 12vw, 72px)',
          fontWeight: 800,
          color: '#e94560',
          textShadow: '0 4px 20px rgba(233, 69, 96, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
          margin: 0,
          marginBottom: '24px',
          textAlign: 'center',
          letterSpacing: '-0.02em',
          animation: 'shake 0.5s ease-in-out',
        }}
      >
        Game Over
      </h1>

      {/* Final Score */}
      <div
        style={{
          fontSize: 'clamp(48px, 15vw, 80px)',
          fontWeight: 800,
          color: '#ffffff',
          textShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
          marginBottom: '8px',
        }}
        aria-label={`Final score: ${score.toLocaleString()}`}
      >
        {score.toLocaleString()}
      </div>

      {/* Score Label */}
      <div
        style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Final Score
      </div>

      {/* New High Score Indicator */}
      {isNewHighScore && (
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#ffd700',
            marginBottom: '24px',
            animation: 'glow 1.5s ease-in-out infinite, bounce 1s ease-in-out infinite',
          }}
          role="status"
          aria-live="polite"
        >
          🏆 New High Score! 🏆
        </div>
      )}

      {/* Previous High Score (when not a new record) */}
      {!isNewHighScore && highScore > 0 && (
        <div
          style={{
            fontSize: '16px',
            color: 'rgba(255, 215, 0, 0.8)',
            marginBottom: '24px',
          }}
        >
          High Score: {highScore.toLocaleString()}
        </div>
      )}

      {/* Buttons Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: '16px',
        }}
      >
        {/* Play Again Button */}
        <button
          className="game-over-button play-again-button"
          onClick={handlePlayAgain}
          style={{
            minWidth: '200px',
            minHeight: '56px',
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            background: 'linear-gradient(180deg, #e94560 0%, #b8374c 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(233, 69, 96, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'background 200ms ease, transform 150ms ease',
            touchAction: 'manipulation',
          }}
          aria-label="Play again"
        >
          Play Again
        </button>

        {/* Main Menu Button */}
        <button
          className="game-over-button main-menu-button"
          onClick={handleMainMenu}
          style={{
            minWidth: '200px',
            minHeight: '56px',
            padding: '16px 48px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'background 200ms ease, transform 150ms ease',
            touchAction: 'manipulation',
          }}
          aria-label="Return to main menu"
        >
          Main Menu
        </button>
      </div>
    </div>
  )
}

// components/Menu/MainMenu.tsx

import { useEffect, useState } from 'react'

interface MainMenuProps {
  highScore: number
  onStartGame: () => void
}

/**
 * Main menu screen with title, start button, instructions, and high score.
 * Features a subtle entrance animation and accessible button sizing.
 */
export function MainMenu({ highScore, onStartGame }: MainMenuProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
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
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .main-menu-button:hover {
            background: linear-gradient(180deg, #e94560 0%, #c23a51 100%) !important;
            transform: scale(1.05);
          }
          .main-menu-button:active {
            transform: scale(0.98);
          }
          .main-menu-button:focus-visible {
            outline: 3px solid #ffffff;
            outline-offset: 3px;
          }
        `}
      </style>

      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(36px, 10vw, 64px)',
          fontWeight: 800,
          color: '#ffffff',
          textShadow: '0 4px 20px rgba(233, 69, 96, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
          margin: 0,
          marginBottom: '16px',
          textAlign: 'center',
          letterSpacing: '-0.02em',
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        Catch Game
      </h1>

      {/* High Score */}
      {highScore > 0 && (
        <div
          style={{
            fontSize: '18px',
            color: '#ffd700',
            fontWeight: 600,
            marginBottom: '32px',
            textShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
          }}
          aria-label={`High score: ${highScore.toLocaleString()}`}
        >
          High Score: {highScore.toLocaleString()}
        </div>
      )}

      {/* Start Button */}
      <button
        className="main-menu-button"
        onClick={onStartGame}
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
          marginBottom: '48px',
          touchAction: 'manipulation',
        }}
        aria-label="Start new game"
      >
        New Game
      </button>

      {/* Instructions */}
      <div
        style={{
          maxWidth: '320px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            marginBottom: '12px',
            fontWeight: 600,
            color: '#ffffff',
            fontSize: '18px',
          }}
        >
          How to Play
        </div>
        <div style={{ marginBottom: '8px' }}>
          Use <kbd style={kbdStyle}>←</kbd> <kbd style={kbdStyle}>→</kbd> arrow keys or touch to move
        </div>
        <div>
          Catch the <span style={{ color: '#4ade80' }}>good items</span> and avoid the{' '}
          <span style={{ color: '#f87171' }}>bad ones</span>!
        </div>
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  fontSize: '14px',
  fontFamily: 'monospace',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  marginInline: '2px',
}

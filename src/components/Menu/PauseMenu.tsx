// components/Menu/PauseMenu.tsx

import { useEffect, useCallback } from 'react'

interface PauseMenuProps {
  onResume: () => void
  onQuit: () => void
}

/**
 * Pause menu overlay with Resume and Quit options.
 * Displays a semi-transparent overlay over the game.
 * Escape key or Resume button continues the game.
 * Quit button returns to main menu.
 */
export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onResume()
      }
    },
    [onResume]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        zIndex: 100,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Game paused"
    >
      <style>
        {`
          .pause-menu-button:hover {
            transform: scale(1.05);
          }
          .pause-menu-button:active {
            transform: scale(0.98);
          }
          .pause-menu-button:focus-visible {
            outline: 3px solid #ffffff;
            outline-offset: 3px;
          }
          .resume-button:hover {
            background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%) !important;
          }
          .quit-button:hover {
            background: rgba(255, 255, 255, 0.2) !important;
          }
        `}
      </style>

      {/* Paused Title */}
      <h1
        style={{
          fontSize: 'clamp(40px, 12vw, 64px)',
          fontWeight: 800,
          color: '#ffffff',
          textShadow: '0 4px 20px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5)',
          margin: 0,
          marginBottom: '48px',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}
      >
        Paused
      </h1>

      {/* Buttons Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Resume Button */}
        <button
          className="pause-menu-button resume-button"
          onClick={onResume}
          style={{
            minWidth: '200px',
            minHeight: '56px',
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'background 200ms ease, transform 150ms ease',
            touchAction: 'manipulation',
          }}
          aria-label="Resume game"
          autoFocus
        >
          Resume
        </button>

        {/* Quit Button */}
        <button
          className="pause-menu-button quit-button"
          onClick={onQuit}
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
          aria-label="Quit to main menu"
        >
          Quit
        </button>
      </div>

      {/* Hint */}
      <div
        style={{
          marginTop: '32px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        Press <kbd style={kbdStyle}>Esc</kbd> to resume
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  fontSize: '12px',
  fontFamily: 'monospace',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  marginInline: '2px',
}

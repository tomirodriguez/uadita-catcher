import { useState, useEffect, useRef, useCallback } from 'react'
import type { InputState } from '../types/game'

/**
 * Keys that should trigger left movement
 */
const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A'])

/**
 * Keys that should trigger right movement
 */
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D'])

/**
 * Keys that should trigger pause toggle
 */
const PAUSE_KEYS = new Set(['Escape', ' '])

/**
 * All keys that should have their default behavior prevented
 */
const PREVENTABLE_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  ' ',
])

export interface UseInputResult {
  input: InputState
  consumePause: () => void
}

/**
 * Hook that handles keyboard input for game controls.
 * Detects Arrow Left/Right and A/D for movement, Escape/Space for pause.
 *
 * @returns Object with input state and consumePause function
 */
export function useInput(): UseInputResult {
  const [input, setInput] = useState<InputState>({
    left: false,
    right: false,
    pause: false,
  })

  // Track if pause was just toggled to prevent rapid firing
  const pauseToggledRef = useRef(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default for game-related keys to avoid scrolling
    if (PREVENTABLE_KEYS.has(event.key)) {
      event.preventDefault()
    }

    const isLeftKey = LEFT_KEYS.has(event.key)
    const isRightKey = RIGHT_KEYS.has(event.key)
    const isPauseKey = PAUSE_KEYS.has(event.key)

    if (isLeftKey || isRightKey) {
      setInput((prev) => ({
        ...prev,
        left: isLeftKey ? true : prev.left,
        right: isRightKey ? true : prev.right,
      }))
    }

    // Pause is a toggle, only trigger on first keydown (not repeat)
    if (isPauseKey && !event.repeat && !pauseToggledRef.current) {
      setInput((prev) => ({ ...prev, pause: true }))
      pauseToggledRef.current = true
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const isLeftKey = LEFT_KEYS.has(event.key)
    const isRightKey = RIGHT_KEYS.has(event.key)
    const isPauseKey = PAUSE_KEYS.has(event.key)

    if (isLeftKey || isRightKey) {
      setInput((prev) => ({
        ...prev,
        left: isLeftKey ? false : prev.left,
        right: isRightKey ? false : prev.right,
      }))
    }

    // Reset pause toggle flag on key release (pause state is reset by consumer)
    if (isPauseKey) {
      pauseToggledRef.current = false
    }
  }, [])

  /**
   * Resets the pause state after it has been consumed by the game loop.
   * Call this after handling the pause action.
   */
  const consumePauseAction = useCallback(() => {
    setInput((prev) => ({ ...prev, pause: false }))
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  return { input, consumePause: consumePauseAction }
}

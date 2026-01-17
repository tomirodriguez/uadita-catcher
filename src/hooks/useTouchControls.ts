import { useState, useEffect, useCallback } from 'react'

/**
 * Touch input state for movement controls.
 * Unlike keyboard input, touch controls don't include pause.
 */
export interface TouchInputState {
  left: boolean
  right: boolean
}

/**
 * Hook that handles touch input for game controls on mobile devices.
 * Divides the screen into left and right zones for movement control.
 *
 * Touch on the left half of the screen activates left movement.
 * Touch on the right half of the screen activates right movement.
 *
 * Events are attached to the window to ensure touches work even on
 * areas outside the canvas (e.g., pillarbox bars on wider screens).
 *
 * @returns TouchInputState object with left and right booleans
 */
export function useTouchControls(): TouchInputState {
  const [touchInput, setTouchInput] = useState<TouchInputState>({
    left: false,
    right: false,
  })

  /**
   * Determines which zone a touch event is in based on screen position.
   * Left zone is the left half of the screen, right zone is the right half.
   */
  const getTouchZone = useCallback(
    (clientX: number): TouchInputState => {
      const screenMiddle = window.innerWidth / 2
      return {
        left: clientX < screenMiddle,
        right: clientX >= screenMiddle,
      }
    },
    []
  )

  /**
   * Updates touch input state based on all active touches.
   * Supports multi-touch: if touching both halves, both left and right are active.
   */
  const updateTouchState = useCallback(
    (touches: TouchList) => {
      if (touches.length === 0) {
        setTouchInput({ left: false, right: false })
        return
      }

      let left = false
      let right = false

      // Check all active touches to support multi-touch
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i]
        const zone = getTouchZone(touch.clientX)
        if (zone.left) left = true
        if (zone.right) right = true
      }

      setTouchInput({ left, right })
    },
    [getTouchZone]
  )

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      event.preventDefault()
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault()
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      event.preventDefault()
      // Use remaining touches after this touch ended
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  const handleTouchCancel = useCallback(
    (event: TouchEvent) => {
      event.preventDefault()
      // Use remaining touches after this touch was cancelled
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  useEffect(() => {
    // Use { passive: false } to allow preventDefault() and prevent scroll/zoom
    const options: AddEventListenerOptions = { passive: false }

    // Attach to window so touches work even outside the canvas (pillarbox areas)
    window.addEventListener('touchstart', handleTouchStart, options)
    window.addEventListener('touchmove', handleTouchMove, options)
    window.addEventListener('touchend', handleTouchEnd, options)
    window.addEventListener('touchcancel', handleTouchCancel, options)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel])

  return touchInput
}

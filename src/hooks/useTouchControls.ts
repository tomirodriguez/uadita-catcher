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
/**
 * Checks if an element or any of its ancestors is an interactive element.
 * Used to allow normal touch behavior on buttons, links, etc.
 */
function isInteractiveElement(element: EventTarget | null): boolean {
  if (!(element instanceof HTMLElement)) return false

  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']
  let current: HTMLElement | null = element

  while (current) {
    if (interactiveTags.includes(current.tagName)) return true
    if (current.getAttribute('role') === 'button') return true
    // Check for data attribute that marks interactive elements
    if (current.dataset.interactive === 'true') return true
    current = current.parentElement
  }

  return false
}

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
      // Don't interfere with interactive elements (buttons, links, etc.)
      if (isInteractiveElement(event.target)) return

      event.preventDefault()
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (isInteractiveElement(event.target)) return

      event.preventDefault()
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (isInteractiveElement(event.target)) return

      event.preventDefault()
      // Use remaining touches after this touch ended
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  const handleTouchCancel = useCallback(
    (event: TouchEvent) => {
      if (isInteractiveElement(event.target)) return

      event.preventDefault()
      // Use remaining touches after this touch was cancelled
      updateTouchState(event.touches)
    },
    [updateTouchState]
  )

  useEffect(() => {
    // Use { passive: false } to allow preventDefault() and prevent scroll/zoom
    // Also use { capture: true } for iOS Safari compatibility
    const options: AddEventListenerOptions = { passive: false, capture: true }

    // Attach to document for better iOS Safari compatibility
    document.addEventListener('touchstart', handleTouchStart, options)
    document.addEventListener('touchmove', handleTouchMove, options)
    document.addEventListener('touchend', handleTouchEnd, options)
    document.addEventListener('touchcancel', handleTouchCancel, options)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart, options)
      document.removeEventListener('touchmove', handleTouchMove, options)
      document.removeEventListener('touchend', handleTouchEnd, options)
      document.removeEventListener('touchcancel', handleTouchCancel, options)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel])

  return touchInput
}

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { CANVAS_CONFIG } from '../../config/gameConfig'

export interface GameCanvasHandle {
  canvas: HTMLCanvasElement | null
  context: CanvasRenderingContext2D | null
}

export interface GameCanvasProps {
  className?: string
}

/**
 * GameCanvas component that renders an HTML5 canvas with responsive scaling.
 * Maintains 9:16 aspect ratio and centers with pillarboxing/letterboxing.
 */
export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)

    // Expose canvas and context refs to parent components
    useImperativeHandle(ref, () => ({
      get canvas() {
        return canvasRef.current
      },
      get context() {
        return contextRef.current
      },
    }))

    /**
     * Resizes and centers the canvas while maintaining 9:16 aspect ratio.
     * Uses pillarboxing for wide screens and letterboxing for tall screens.
     */
    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const windowRatio = window.innerWidth / window.innerHeight

      let displayWidth: number
      let displayHeight: number

      if (windowRatio > CANVAS_CONFIG.ASPECT_RATIO) {
        // Screen is wider than game - use pillarboxing (black bars on sides)
        displayHeight = window.innerHeight
        displayWidth = displayHeight * CANVAS_CONFIG.ASPECT_RATIO
      } else {
        // Screen is taller than game - use letterboxing (black bars on top/bottom)
        displayWidth = window.innerWidth
        displayHeight = displayWidth / CANVAS_CONFIG.ASPECT_RATIO
      }

      // Set display size (CSS pixels)
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      // Center the canvas
      canvas.style.position = 'absolute'
      canvas.style.left = `${(window.innerWidth - displayWidth) / 2}px`
      canvas.style.top = `${(window.innerHeight - displayHeight) / 2}px`
    }, [])

    // Initialize canvas context and set up resize handling
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Set internal resolution (drawing buffer size)
      canvas.width = CANVAS_CONFIG.BASE_WIDTH
      canvas.height = CANVAS_CONFIG.BASE_HEIGHT

      // Get 2D context with alpha disabled for better performance
      const ctx = canvas.getContext('2d', { alpha: false })
      if (ctx) {
        contextRef.current = ctx
      }

      // Initial resize
      resizeCanvas()

      // Listen for window resize events
      window.addEventListener('resize', resizeCanvas)

      return () => {
        window.removeEventListener('resize', resizeCanvas)
      }
    }, [resizeCanvas])

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: 'block',
          touchAction: 'none',
        }}
      />
    )
  }
)

// systems/FeedbackSystem.ts

/**
 * Represents a single floating text element with animation properties.
 */
export interface FloatingText {
  /** The text to display (e.g., '+10', '-5', 'COMBO x5!') */
  text: string
  /** X position in canvas coordinates */
  x: number
  /** Y position in canvas coordinates */
  y: number
  /** Vertical velocity (negative = moving up) */
  vy: number
  /** Opacity from 0 to 1 */
  alpha: number
  /** Scale factor for the text size */
  scale: number
  /** CSS color string */
  color: string
  /** Elapsed time since spawn in seconds */
  elapsed: number
}

/** Default animation duration in seconds */
const ANIMATION_DURATION = 1.0

/** Initial vertical velocity (pixels per second, negative = up) */
const INITIAL_VY = -80

/** Velocity decay factor per frame */
const VY_DECAY = 0.95

/** Initial scale factor */
const INITIAL_SCALE = 1.5

/** Scale decay per frame (converges toward 1.0) */
const SCALE_DECAY = 0.95

/** Minimum scale (stops shrinking at this value) */
const MIN_SCALE = 1.0

/** Base font size in pixels */
const BASE_FONT_SIZE = 20

/** Font family for floating text */
const FONT_FAMILY = 'Arial, sans-serif'

/** Predefined colors for common feedback types */
export const FEEDBACK_COLORS = {
  good: '#22c55e', // Green for positive points
  bad: '#ef4444', // Red for negative points/bad catch
  combo: '#ffd700', // Gold for combo milestones
  perfect: '#60a5fa', // Blue for perfect catches
  save: '#a855f7', // Purple for save catches
} as const

/**
 * Manages floating text animations for score feedback.
 *
 * Usage:
 * ```typescript
 * const feedbackSystem = new FloatingTextManager()
 *
 * // In game loop update:
 * feedbackSystem.update(deltaTime)
 *
 * // In render loop:
 * feedbackSystem.render(ctx)
 *
 * // When player catches an item:
 * feedbackSystem.spawn('+10', itemX, itemY, FEEDBACK_COLORS.good)
 * ```
 */
export class FloatingTextManager {
  private texts: FloatingText[] = []

  /**
   * Creates a new floating text at the specified position.
   *
   * @param text - The text to display (e.g., '+10', '-5', 'COMBO x5!')
   * @param x - X position in canvas coordinates
   * @param y - Y position in canvas coordinates
   * @param color - CSS color string (default: gold)
   */
  spawn(text: string, x: number, y: number, color: string = FEEDBACK_COLORS.good): void {
    this.texts.push({
      text,
      x,
      y,
      vy: INITIAL_VY,
      alpha: 1,
      scale: INITIAL_SCALE,
      color,
      elapsed: 0,
    })
  }

  /**
   * Spawns floating text for catching a good item.
   *
   * @param points - Points gained
   * @param x - X position
   * @param y - Y position
   */
  spawnGoodCatch(points: number, x: number, y: number): void {
    this.spawn(`+${points}`, x, y, FEEDBACK_COLORS.good)
  }

  /**
   * Spawns floating text for catching a bad item.
   *
   * @param points - Points lost (should be negative or will be shown as negative)
   * @param x - X position
   * @param y - Y position
   */
  spawnBadCatch(points: number, x: number, y: number): void {
    const displayPoints = points > 0 ? -points : points
    this.spawn(`${displayPoints}`, x, y, FEEDBACK_COLORS.bad)
  }

  /**
   * Spawns floating text for a combo milestone.
   *
   * @param comboCount - Current combo count
   * @param x - X position
   * @param y - Y position
   */
  spawnCombo(comboCount: number, x: number, y: number): void {
    this.spawn(`COMBO x${comboCount}!`, x, y, FEEDBACK_COLORS.combo)
  }

  /**
   * Spawns floating text for a perfect catch bonus.
   *
   * @param points - Points gained
   * @param x - X position
   * @param y - Y position
   */
  spawnPerfectCatch(points: number, x: number, y: number): void {
    this.spawn(`+${points}`, x, y, FEEDBACK_COLORS.perfect)
  }

  /**
   * Updates all floating texts. Should be called each frame.
   * Removes texts that have completed their animation.
   *
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    this.texts = this.texts.filter((t) => {
      // Update elapsed time
      t.elapsed += dt

      // Calculate animation progress (0 to 1)
      const progress = t.elapsed / ANIMATION_DURATION

      // Update position (move upward with decay)
      t.y += t.vy * dt
      t.vy *= VY_DECAY

      // Update alpha (fade out over time)
      // Use easeOutQuad for smoother fade: starts fast, slows down
      t.alpha = 1 - progress * progress

      // Update scale (shrink from initial scale toward 1.0)
      t.scale = Math.max(MIN_SCALE, t.scale * SCALE_DECAY)

      // Keep text if animation is not complete
      return progress < 1
    })
  }

  /**
   * Renders all active floating texts to the canvas.
   *
   * @param ctx - Canvas 2D rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const t of this.texts) {
      ctx.save()

      // Set opacity
      ctx.globalAlpha = Math.max(0, t.alpha)

      // Set fill style
      ctx.fillStyle = t.color

      // Set font with scaled size
      const fontSize = Math.round(BASE_FONT_SIZE * t.scale)
      ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`

      // Center text horizontally
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Optional: Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      // Draw the text
      ctx.fillText(t.text, t.x, t.y)

      ctx.restore()
    }
  }

  /**
   * Returns the number of active floating texts.
   * Useful for debugging or limiting concurrent texts.
   */
  get count(): number {
    return this.texts.length
  }

  /**
   * Clears all active floating texts.
   * Call this when resetting the game or transitioning screens.
   */
  clear(): void {
    this.texts = []
  }
}

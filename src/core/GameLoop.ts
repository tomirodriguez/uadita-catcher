/**
 * GameLoop - Fixed timestep game loop with interpolation
 *
 * Uses a fixed timestep (60 updates/second) for physics/logic consistency
 * and interpolation for smooth rendering at any frame rate.
 */

/** Fixed timestep in milliseconds (~16.67ms for 60 updates/second) */
export const TIMESTEP = 1000 / 60

/** Maximum frame time to prevent "spiral of death" when tab is inactive */
export const MAX_FRAME_TIME = 250

export type UpdateCallback = (dt: number) => void
export type RenderCallback = (alpha: number) => void

export interface GameLoopCallbacks {
  update: UpdateCallback
  render: RenderCallback
}

export class GameLoop {
  private accumulator = 0
  private lastTimestamp = 0
  private animationFrameId: number | null = null
  private isRunning = false

  private updateCallback: UpdateCallback | null = null
  private renderCallback: RenderCallback | null = null

  constructor(callbacks?: Partial<GameLoopCallbacks>) {
    if (callbacks?.update) {
      this.updateCallback = callbacks.update
    }
    if (callbacks?.render) {
      this.renderCallback = callbacks.render
    }

    // Bind methods for event listeners
    this.loop = this.loop.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
  }

  /**
   * Set the update callback (called with fixed timestep)
   * @param callback - Function called each fixed timestep with dt in seconds
   */
  setUpdate(callback: UpdateCallback): void {
    this.updateCallback = callback
  }

  /**
   * Set the render callback (called each frame with interpolation alpha)
   * @param callback - Function called each frame with alpha (0-1) for interpolation
   */
  setRender(callback: RenderCallback): void {
    this.renderCallback = callback
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTimestamp = performance.now()
    this.accumulator = 0

    // Add visibility change listener to pause when tab is not visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange)

    // Start the loop
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }

  /**
   * Check if the game loop is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning
  }

  /**
   * Main game loop with fixed timestep updates and interpolated rendering
   */
  private loop(timestamp: number): void {
    if (!this.isRunning) return

    // Calculate frame time (capped to prevent spiral of death)
    let frameTime = timestamp - this.lastTimestamp
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME
    }

    this.accumulator += frameTime
    this.lastTimestamp = timestamp

    // Fixed timestep updates (physics/logic)
    // Run multiple updates if necessary to catch up
    while (this.accumulator >= TIMESTEP) {
      if (this.updateCallback) {
        // Pass dt in seconds for easier physics calculations
        this.updateCallback(TIMESTEP / 1000)
      }
      this.accumulator -= TIMESTEP
    }

    // Calculate interpolation alpha (0-1) for smooth rendering
    const alpha = this.accumulator / TIMESTEP

    if (this.renderCallback) {
      this.renderCallback(alpha)
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /**
   * Handle document visibility changes to pause/resume when tab is hidden
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Pause the loop when tab is not visible
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    } else if (this.isRunning) {
      // Resume the loop when tab becomes visible again
      // Reset timestamp to prevent large delta on resume
      this.lastTimestamp = performance.now()
      this.accumulator = 0
      this.animationFrameId = requestAnimationFrame(this.loop)
    }
  }
}

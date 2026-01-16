// entities/Player.ts

import type { Player } from '../types/game'
import { PLAYER_ASSET } from '../config/assets'
import { CANVAS_CONFIG } from '../config/gameConfig'

/**
 * Player sprite image for rendering.
 * Loaded once and reused across render calls.
 */
let playerImage: HTMLImageElement | null = null
let imageLoaded = false
let imageLoadAttempted = false

/**
 * Loads the player sprite image asynchronously.
 * Safe to call multiple times - only loads once.
 */
export function loadPlayerImage(): Promise<void> {
  if (imageLoadAttempted) {
    return Promise.resolve()
  }

  imageLoadAttempted = true

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      playerImage = img
      imageLoaded = true
      resolve()
    }
    img.onerror = () => {
      // Image failed to load, will use fallback rectangle
      imageLoaded = false
      resolve()
    }
    img.src = PLAYER_ASSET.path
  })
}

/**
 * Generates a unique ID for entities.
 */
function generateId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Creates a new player with initial values.
 * Player is centered horizontally at the bottom of the canvas.
 */
export function createPlayer(): Player {
  const width = PLAYER_ASSET.width
  const height = PLAYER_ASSET.height

  // Center horizontally
  const x = (CANVAS_CONFIG.BASE_WIDTH - width) / 2

  // Position at bottom of canvas with some padding
  const bottomPadding = 20
  const y = CANVAS_CONFIG.BASE_HEIGHT - height - bottomPadding

  return {
    id: generateId(),
    x,
    y,
    width,
    height,
    velocity: { vx: 0, vy: 0 },
    speed: 0,
    isInvulnerable: false,
    invulnerabilityTimer: 0,
  }
}

/**
 * Interpolates between previous and current position for smooth rendering.
 */
function interpolate(previous: number, current: number, alpha: number): number {
  return previous + (current - previous) * alpha
}

/**
 * Fallback color for when image fails to load.
 */
const FALLBACK_COLOR = '#4A90D9'

/**
 * Renders the player sprite with interpolation for smooth animation.
 *
 * @param ctx - The canvas 2D rendering context
 * @param player - The current player state
 * @param alpha - Interpolation factor (0-1) for smooth rendering between physics updates
 * @param previousX - Optional previous X position for interpolation
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  alpha: number,
  previousX?: number
): void {
  // Calculate interpolated position
  const renderX =
    previousX !== undefined ? interpolate(previousX, player.x, alpha) : player.x
  const renderY = player.y // Y doesn't change for player

  // Handle invulnerability flashing
  if (player.isInvulnerable) {
    // Flash effect: alternate visibility based on time
    const flashPeriod = 100 // ms
    const shouldShow = Math.floor(player.invulnerabilityTimer / flashPeriod) % 2 === 0
    if (!shouldShow) {
      return // Skip rendering during "off" phase of flash
    }
  }

  ctx.save()

  if (imageLoaded && playerImage) {
    // Draw the player sprite
    ctx.drawImage(playerImage, renderX, renderY, player.width, player.height)
  } else {
    // Fallback: draw a colored rectangle
    ctx.fillStyle = FALLBACK_COLOR
    ctx.fillRect(renderX, renderY, player.width, player.height)

    // Add a simple border for visibility
    ctx.strokeStyle = '#2A5A99'
    ctx.lineWidth = 2
    ctx.strokeRect(renderX, renderY, player.width, player.height)
  }

  ctx.restore()
}

/**
 * Checks if the player image has been loaded successfully.
 */
export function isPlayerImageLoaded(): boolean {
  return imageLoaded
}

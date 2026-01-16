// systems/MovementSystem.ts

import type { Player, InputState } from '../types/game'
import { PLAYER_CONFIG, CANVAS_CONFIG } from '../config/gameConfig'

/**
 * Clamps a value between a minimum and maximum.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Updates player movement based on input and delta time.
 * Uses acceleration when input is active, and deceleration (friction) when not.
 * Movement is frame-independent using delta time.
 *
 * @param player - The player entity to update
 * @param input - The current input state (left/right keys)
 * @param dt - Delta time in seconds
 */
export function updatePlayerMovement(
  player: Player,
  input: InputState,
  dt: number
): void {
  // Calculate movement direction: -1 for left, 1 for right, 0 for none
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0)

  if (direction !== 0) {
    // Accelerating in the direction of input
    player.velocity.vx += direction * PLAYER_CONFIG.acceleration * dt

    // Clamp velocity to max speed
    player.velocity.vx = clamp(
      player.velocity.vx,
      -PLAYER_CONFIG.maxSpeed,
      PLAYER_CONFIG.maxSpeed
    )
  } else {
    // Decelerating (friction) when no input
    const friction = PLAYER_CONFIG.deceleration * dt

    if (Math.abs(player.velocity.vx) <= friction) {
      // Velocity is small enough to stop completely
      player.velocity.vx = 0
    } else {
      // Apply friction in the opposite direction of current velocity
      player.velocity.vx -= Math.sign(player.velocity.vx) * friction
    }
  }

  // Update position based on velocity
  player.x += player.velocity.vx * dt

  // Clamp position to canvas boundaries
  const minX = 0
  const maxX = CANVAS_CONFIG.BASE_WIDTH - player.width

  player.x = clamp(player.x, minX, maxX)

  // If we hit a boundary, stop velocity to prevent "sliding" along the edge
  if (player.x <= minX || player.x >= maxX) {
    player.velocity.vx = 0
  }
}

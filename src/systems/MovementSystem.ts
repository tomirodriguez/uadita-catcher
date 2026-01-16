// systems/MovementSystem.ts

import type { Player, InputState, DifficultyState } from '../types/game'
import type { FallingObjectEntity } from '../entities/FallingObject'
import type { ObjectPool } from '../core/ObjectPool'
import { PLAYER_CONFIG, CANVAS_CONFIG } from '../config/gameConfig'

/**
 * Distance from bottom of canvas where objects are marked as saveable.
 * Objects in this zone give bonus points when caught ("save" mechanic).
 */
const SAVE_ZONE = 50

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

/**
 * Updates all falling objects' positions and handles objects leaving the screen.
 * Movement is frame-independent using delta time.
 *
 * @param objects - Array of falling object entities to update
 * @param pool - Object pool for releasing objects that leave the screen
 * @param difficulty - Current difficulty state containing fallSpeed
 * @param dt - Delta time in seconds
 * @param canvasHeight - Height of the canvas for boundary checking
 */
export function updateFallingObjects(
  objects: FallingObjectEntity[],
  pool: ObjectPool<FallingObjectEntity>,
  difficulty: DifficultyState,
  dt: number,
  canvasHeight: number
): void {
  for (const obj of objects) {
    if (!obj.active) continue

    // Move object downward using delta time for frame-independent movement
    obj.y += difficulty.fallSpeed * dt

    // Mark as saveable when near the bottom (save zone gives bonus points)
    if (obj.y > canvasHeight - SAVE_ZONE && !obj.isSaveable) {
      obj.isSaveable = true
    }

    // Release objects that have completely exited the canvas
    if (obj.y > canvasHeight) {
      pool.release(obj)
    }
  }
}

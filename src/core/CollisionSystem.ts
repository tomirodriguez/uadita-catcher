// core/CollisionSystem.ts

import type { AABB, Player, FallingObject } from '../types/game'

/**
 * Collision zone padding for catch detection (pixels).
 * Adds tolerance to make catching easier and feel better.
 */
const CATCH_ZONE_PADDING = 10

/**
 * Perfect zone size as a fraction of player size.
 * 0.5 means the perfect zone is 50% of the player's dimensions.
 */
const PERFECT_ZONE_SIZE = 0.5

/**
 * Height of the neutral zone at the bottom of the screen (pixels).
 * Items in this zone cannot be caught - they're considered "already fallen".
 * This prevents frustrating catches when items are barely touched at the bottom.
 */
const NEUTRAL_ZONE_HEIGHT = 50

/**
 * Collision type indicating how the object was caught.
 */
export type CollisionType = 'normal' | 'perfect'

/**
 * Result of checking AABB collision with overlap info.
 */
export interface CollisionResult {
  colliding: boolean
  overlapX: number
  overlapY: number
}

/**
 * Detected collision between player and falling object.
 */
export interface DetectedCollision {
  object: FallingObject
  type: CollisionType
}

/**
 * Checks if two axis-aligned bounding boxes are colliding.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns true if the boxes overlap, false otherwise
 */
export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/**
 * Gets detailed collision information including overlap amounts.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns Collision result with overlap values
 */
export function getCollisionInfo(a: AABB, b: AABB): CollisionResult {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)

  return {
    colliding: overlapX > 0 && overlapY > 0,
    overlapX: Math.max(0, overlapX),
    overlapY: Math.max(0, overlapY),
  }
}

/**
 * Gets the actual hitbox AABB for a player (using hitbox dimensions).
 *
 * @param player - The player entity
 * @returns AABB representing the player's hitbox
 */
export function getPlayerHitbox(player: Player): AABB {
  return {
    x: player.x + player.hitbox.offsetX,
    y: player.y + player.hitbox.offsetY,
    width: player.hitbox.width,
    height: player.hitbox.height,
  }
}

/**
 * Gets the catch zone AABB for a player.
 * The catch zone is larger than the player hitbox by CATCH_ZONE_PADDING
 * on all sides, making it easier to catch falling objects.
 *
 * @param player - The player entity
 * @returns AABB representing the catch zone
 */
export function getCatchZone(player: Player): AABB {
  const hitbox = getPlayerHitbox(player)
  return {
    x: hitbox.x - CATCH_ZONE_PADDING,
    y: hitbox.y - CATCH_ZONE_PADDING,
    width: hitbox.width + CATCH_ZONE_PADDING * 2,
    height: hitbox.height + CATCH_ZONE_PADDING * 2,
  }
}

/**
 * Gets the perfect zone AABB for a player.
 * The perfect zone is centered on the player's hitbox and is 50% of the hitbox size.
 * Catching objects in this zone awards bonus points.
 *
 * @param player - The player entity
 * @returns AABB representing the perfect zone
 */
export function getPerfectZone(player: Player): AABB {
  const hitbox = getPlayerHitbox(player)
  const perfectWidth = hitbox.width * PERFECT_ZONE_SIZE
  const perfectHeight = hitbox.height * PERFECT_ZONE_SIZE

  // Center the perfect zone on the hitbox
  const offsetX = (hitbox.width - perfectWidth) / 2
  const offsetY = (hitbox.height - perfectHeight) / 2

  return {
    x: hitbox.x + offsetX,
    y: hitbox.y + offsetY,
    width: perfectWidth,
    height: perfectHeight,
  }
}

/**
 * Checks all falling objects for collisions with the player.
 * Returns an array of detected collisions with their type (normal/perfect).
 * Objects in the neutral zone at the bottom are ignored to prevent
 * frustrating accidental catches.
 *
 * @param player - The player entity
 * @param objects - Array of falling objects to check
 * @param canvasHeight - Height of the game canvas (optional, enables neutral zone)
 * @returns Array of detected collisions
 */
export function checkCollisions(
  player: Player,
  objects: FallingObject[],
  canvasHeight?: number
): DetectedCollision[] {
  const collisions: DetectedCollision[] = []
  const catchZone = getCatchZone(player)
  const perfectZone = getPerfectZone(player)

  // Calculate neutral zone threshold (bottom of screen)
  const neutralZoneStart = canvasHeight ? canvasHeight - NEUTRAL_ZONE_HEIGHT : Infinity

  for (const obj of objects) {
    if (!obj.active) continue

    // Skip objects in the neutral zone (too far down to catch)
    // Use visual height for neutral zone check (when object is visually off screen)
    if (obj.y + obj.height > neutralZoneStart) continue

    // Create AABB for the falling object using hitbox dimensions
    const objectBox: AABB = {
      x: obj.x + obj.hitbox.offsetX,
      y: obj.y + obj.hitbox.offsetY,
      width: obj.hitbox.width,
      height: obj.hitbox.height,
    }

    // Check if object is within catch zone
    if (checkAABBCollision(catchZone, objectBox)) {
      // Determine collision type
      const type: CollisionType = checkAABBCollision(perfectZone, objectBox)
        ? 'perfect'
        : 'normal'

      collisions.push({
        object: obj,
        type,
      })
    }
  }

  return collisions
}

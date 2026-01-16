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
 * Gets the catch zone AABB for a player.
 * The catch zone is larger than the player hitbox by CATCH_ZONE_PADDING
 * on all sides, making it easier to catch falling objects.
 *
 * @param player - The player entity
 * @returns AABB representing the catch zone
 */
export function getCatchZone(player: Player): AABB {
  return {
    x: player.x - CATCH_ZONE_PADDING,
    y: player.y - CATCH_ZONE_PADDING,
    width: player.width + CATCH_ZONE_PADDING * 2,
    height: player.height + CATCH_ZONE_PADDING * 2,
  }
}

/**
 * Gets the perfect zone AABB for a player.
 * The perfect zone is centered on the player and is 50% of the player's size.
 * Catching objects in this zone awards bonus points.
 *
 * @param player - The player entity
 * @returns AABB representing the perfect zone
 */
export function getPerfectZone(player: Player): AABB {
  const perfectWidth = player.width * PERFECT_ZONE_SIZE
  const perfectHeight = player.height * PERFECT_ZONE_SIZE

  // Center the perfect zone on the player
  const offsetX = (player.width - perfectWidth) / 2
  const offsetY = (player.height - perfectHeight) / 2

  return {
    x: player.x + offsetX,
    y: player.y + offsetY,
    width: perfectWidth,
    height: perfectHeight,
  }
}

/**
 * Checks all falling objects for collisions with the player.
 * Returns an array of detected collisions with their type (normal/perfect).
 *
 * @param player - The player entity
 * @param objects - Array of falling objects to check
 * @returns Array of detected collisions
 */
export function checkCollisions(
  player: Player,
  objects: FallingObject[]
): DetectedCollision[] {
  const collisions: DetectedCollision[] = []
  const catchZone = getCatchZone(player)
  const perfectZone = getPerfectZone(player)

  for (const obj of objects) {
    if (!obj.active) continue

    // Create AABB for the falling object
    const objectBox: AABB = {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
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

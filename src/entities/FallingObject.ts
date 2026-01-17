// entities/FallingObject.ts

import type { FallingObject, Poolable, Velocity, Hitbox } from '../types/game'
import { ObjectPool } from '../core/ObjectPool'
import { GOOD_ITEMS, BAD_ITEMS } from '../config/assets'

/**
 * Default dimensions for falling objects
 */
const DEFAULT_WIDTH = 40
const DEFAULT_HEIGHT = 40

/**
 * Initial pool size for falling objects
 */
const INITIAL_POOL_SIZE = 50

/**
 * Images for good items (loaded once, reused across objects)
 */
const goodImages: HTMLImageElement[] = []
let goodImagesLoaded = false

/**
 * Images for bad items (loaded once, reused across objects)
 */
const badImages: HTMLImageElement[] = []
let badImagesLoaded = false

/**
 * Load all good item images asynchronously.
 * Safe to call multiple times - only loads once.
 */
export function loadGoodImages(): Promise<void> {
  if (goodImagesLoaded) {
    return Promise.resolve()
  }

  const promises = GOOD_ITEMS.map((item, index) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        goodImages[index] = img
        resolve()
      }
      img.onerror = () => {
        // Image failed to load, slot will remain empty
        resolve()
      }
      img.src = item.path
    })
  })

  return Promise.all(promises).then(() => {
    goodImagesLoaded = true
  })
}

/**
 * Load all bad item images asynchronously.
 * Safe to call multiple times - only loads once.
 */
export function loadBadImages(): Promise<void> {
  if (badImagesLoaded) {
    return Promise.resolve()
  }

  const promises = BAD_ITEMS.map((item, index) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        badImages[index] = img
        resolve()
      }
      img.onerror = () => {
        // Image failed to load, slot will remain empty
        resolve()
      }
      img.src = item.path
    })
  })

  return Promise.all(promises).then(() => {
    badImagesLoaded = true
  })
}

/**
 * Load all falling object images (good and bad).
 * Safe to call multiple times - only loads once.
 */
export function loadFallingObjectImages(): Promise<void> {
  return Promise.all([loadGoodImages(), loadBadImages()]).then(() => {
    // Both sets loaded
  })
}

/**
 * Get the image for a falling object by type and sprite index.
 * Returns null if image not loaded.
 */
export function getFallingObjectImage(
  type: 'good' | 'bad',
  spriteIndex: number
): HTMLImageElement | null {
  const images = type === 'good' ? goodImages : badImages
  const index = spriteIndex % images.length
  return images[index] ?? null
}

/**
 * Check if all falling object images have been loaded.
 */
export function areFallingObjectImagesLoaded(): boolean {
  return goodImagesLoaded && badImagesLoaded
}

/**
 * Generates a unique ID for falling objects.
 */
let idCounter = 0
function generateId(): string {
  idCounter++
  return `falling_${idCounter}`
}

/**
 * FallingObjectEntity class implements both FallingObject interface and Poolable.
 * Used for object pooling to avoid garbage collection stutters.
 */
export class FallingObjectEntity implements FallingObject, Poolable {
  id: string
  x: number
  y: number
  width: number
  height: number
  velocity: Velocity
  type: 'good' | 'bad'
  points: number
  spriteIndex: number
  active: boolean
  isSaveable: boolean
  hitbox: Hitbox

  constructor() {
    this.id = generateId()
    this.x = 0
    this.y = 0
    this.width = DEFAULT_WIDTH
    this.height = DEFAULT_HEIGHT
    this.velocity = { vx: 0, vy: 0 }
    this.type = 'good'
    this.points = 0
    this.spriteIndex = 0
    this.active = false
    this.isSaveable = false
    this.hitbox = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, offsetX: 0, offsetY: 0 }
  }

  /**
   * Resets all properties to default values.
   * Called when object is released back to pool.
   */
  reset(): void {
    this.id = generateId()
    this.x = 0
    this.y = 0
    this.width = DEFAULT_WIDTH
    this.height = DEFAULT_HEIGHT
    this.velocity = { vx: 0, vy: 0 }
    this.type = 'good'
    this.points = 0
    this.spriteIndex = 0
    this.isSaveable = false
    this.hitbox = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, offsetX: 0, offsetY: 0 }
    // Note: active is managed by the pool, not reset here
  }

  /**
   * Spawns/initializes the object for use in the game.
   *
   * @param x - Horizontal position
   * @param type - 'good' or 'bad' item type
   * @param speed - Fall speed in pixels per second
   * @param spriteIndex - Index for sprite variation (0-3)
   */
  spawn(x: number, type: 'good' | 'bad', speed: number, spriteIndex: number): void {
    this.x = x
    this.y = -this.height // Start above the screen
    this.type = type
    this.velocity = { vx: 0, vy: speed }
    this.spriteIndex = spriteIndex % 4 // Ensure valid index (0-3)

    // Set points based on type
    const items = type === 'good' ? GOOD_ITEMS : BAD_ITEMS
    const itemIndex = this.spriteIndex % items.length
    this.points = items[itemIndex].points

    // Set dimensions from config
    this.width = items[itemIndex].width
    this.height = items[itemIndex].height

    // Set hitbox from config
    const hitboxConfig = items[itemIndex].hitbox
    this.hitbox = {
      width: hitboxConfig.width,
      height: hitboxConfig.height,
      offsetX: hitboxConfig.offsetX,
      offsetY: hitboxConfig.offsetY,
    }

    this.isSaveable = false
  }
}

/**
 * Factory function that creates a FallingObjectEntity.
 * Used by ObjectPool for creating new instances.
 */
function createFallingObject(): FallingObjectEntity {
  return new FallingObjectEntity()
}

/**
 * Creates an ObjectPool pre-populated with FallingObjectEntity instances.
 *
 * @returns ObjectPool with 50 initial FallingObjectEntity objects
 */
export function createFallingObjectPool(): ObjectPool<FallingObjectEntity> {
  return new ObjectPool(createFallingObject, INITIAL_POOL_SIZE)
}

/**
 * Fallback colors for when images fail to load.
 */
const GOOD_FALLBACK_COLOR = '#22c55e'
const BAD_FALLBACK_COLOR = '#ef4444'

/**
 * Renders a falling object to the canvas.
 *
 * @param ctx - Canvas 2D rendering context
 * @param obj - The falling object to render
 * @param alpha - Interpolation factor (0-1) for smooth rendering
 * @param previousY - Optional previous Y position for interpolation
 */
export function renderFallingObject(
  ctx: CanvasRenderingContext2D,
  obj: FallingObjectEntity,
  alpha: number,
  previousY?: number
): void {
  if (!obj.active) return

  // Calculate interpolated position
  const renderY = previousY !== undefined ? previousY + (obj.y - previousY) * alpha : obj.y
  const renderX = obj.x

  const image = getFallingObjectImage(obj.type, obj.spriteIndex)

  ctx.save()

  if (image) {
    ctx.drawImage(image, renderX, renderY, obj.width, obj.height)
  } else {
    // Fallback: draw colored rectangle
    ctx.fillStyle = obj.type === 'good' ? GOOD_FALLBACK_COLOR : BAD_FALLBACK_COLOR
    ctx.fillRect(renderX, renderY, obj.width, obj.height)

    // Add border
    ctx.strokeStyle = obj.type === 'good' ? '#16a34a' : '#dc2626'
    ctx.lineWidth = 2
    ctx.strokeRect(renderX, renderY, obj.width, obj.height)
  }

  ctx.restore()
}

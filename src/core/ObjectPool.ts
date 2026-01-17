import type { Poolable } from '../types/game'

const DEFAULT_INITIAL_SIZE = 50
const MAX_POOL_SIZE = 200

/**
 * Generic object pool for reusing objects to avoid garbage collection stutters.
 * Objects must implement the Poolable interface with `active` boolean and `reset()` method.
 */
export class ObjectPool<T extends Poolable> {
  private readonly pool: T[] = []
  private readonly factory: () => T

  constructor(factory: () => T, initialSize = DEFAULT_INITIAL_SIZE) {
    this.factory = factory
    for (let i = 0; i < initialSize; i++) {
      const obj = factory()
      obj.active = false
      this.pool.push(obj)
    }
  }

  /**
   * Acquire an inactive object from the pool.
   * If no inactive objects are available and pool is not at max size, creates a new one.
   * @returns An active object ready for use, or null if pool is at max capacity
   */
  acquire(): T | null {
    for (const obj of this.pool) {
      if (!obj.active) {
        obj.active = true
        obj.reset()
        return obj
      }
    }

    // Expand pool if not at max capacity
    if (this.pool.length < MAX_POOL_SIZE) {
      const newObj = this.factory()
      newObj.active = true
      this.pool.push(newObj)
      return newObj
    }

    return null
  }

  /**
   * Release an object back to the pool for reuse.
   * @param obj The object to release
   */
  release(obj: T): void {
    obj.active = false
    obj.reset()
  }

  /**
   * Iterate over all active objects without creating intermediate arrays.
   * @param callback Function to call for each active object
   */
  forEachActive(callback: (obj: T, index: number) => void): void {
    let activeIndex = 0
    for (const obj of this.pool) {
      if (obj.active) {
        callback(obj, activeIndex)
        activeIndex++
      }
    }
  }

  /**
   * Get the count of currently active objects.
   */
  getActiveCount(): number {
    let count = 0
    for (const obj of this.pool) {
      if (obj.active) {
        count++
      }
    }
    return count
  }

  /**
   * Get the total pool size (active + inactive objects).
   */
  getPoolSize(): number {
    return this.pool.length
  }

  /**
   * Release all active objects back to the pool.
   * Useful for resetting game state.
   */
  releaseAll(): void {
    for (const obj of this.pool) {
      if (obj.active) {
        obj.active = false
        obj.reset()
      }
    }
  }
}

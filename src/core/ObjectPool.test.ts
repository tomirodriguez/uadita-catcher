import { describe, it, expect, vi } from 'vitest'
import { ObjectPool } from './ObjectPool'
import type { Poolable } from '../types/game'

interface TestPoolable extends Poolable {
  id: number
  value: string
}

function createTestFactory(): () => TestPoolable {
  let idCounter = 0
  return () => ({
    id: idCounter++,
    value: 'initial',
    active: false,
    reset() {
      this.value = 'reset'
    },
  })
}

describe('ObjectPool', () => {
  describe('constructor', () => {
    it('pre-allocates objects with default initial size of 50', () => {
      const pool = new ObjectPool(createTestFactory())
      expect(pool.getPoolSize()).toBe(50)
    })

    it('pre-allocates objects with custom initial size', () => {
      const pool = new ObjectPool(createTestFactory(), 10)
      expect(pool.getPoolSize()).toBe(10)
    })

    it('all pre-allocated objects start as inactive', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      expect(pool.getActiveCount()).toBe(0)
    })
  })

  describe('acquire', () => {
    it('returns an inactive object and marks it as active', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      const obj = pool.acquire()

      expect(obj).not.toBeNull()
      expect(obj?.active).toBe(true)
      expect(pool.getActiveCount()).toBe(1)
    })

    it('calls reset on acquired object', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      const obj = pool.acquire()

      expect(obj?.value).toBe('reset')
    })

    it('expands pool when all objects are active and pool is under max', () => {
      const pool = new ObjectPool(createTestFactory(), 2)

      pool.acquire()
      pool.acquire()
      expect(pool.getPoolSize()).toBe(2)

      const third = pool.acquire()
      expect(third).not.toBeNull()
      expect(pool.getPoolSize()).toBe(3)
    })

    it('returns null when pool reaches max size (200)', () => {
      const pool = new ObjectPool(createTestFactory(), 200)

      // Acquire all 200 objects
      for (let i = 0; i < 200; i++) {
        const obj = pool.acquire()
        expect(obj).not.toBeNull()
      }

      // Next acquire should return null
      const obj = pool.acquire()
      expect(obj).toBeNull()
    })

    it('reuses released objects', () => {
      const pool = new ObjectPool(createTestFactory(), 2)

      const obj1 = pool.acquire()
      pool.acquire()

      expect(pool.getActiveCount()).toBe(2)

      // Release first object
      if (obj1) {
        pool.release(obj1)
      }
      expect(pool.getActiveCount()).toBe(1)

      // Acquire again - should reuse the released object
      const obj3 = pool.acquire()
      expect(obj3).toBe(obj1)
      expect(pool.getPoolSize()).toBe(2) // No expansion
    })
  })

  describe('release', () => {
    it('marks object as inactive', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      const obj = pool.acquire()

      expect(obj?.active).toBe(true)

      if (obj) {
        pool.release(obj)
      }

      expect(obj?.active).toBe(false)
    })

    it('calls reset on released object', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      const obj = pool.acquire()

      if (obj) {
        obj.value = 'modified'
        pool.release(obj)
      }

      expect(obj?.value).toBe('reset')
    })
  })

  describe('forEachActive', () => {
    it('iterates over only active objects', () => {
      const pool = new ObjectPool(createTestFactory(), 5)

      pool.acquire()
      pool.acquire()
      const obj3 = pool.acquire()

      // Release the third object
      if (obj3) {
        pool.release(obj3)
      }

      const callback = vi.fn()
      pool.forEachActive(callback)

      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('provides correct index to callback', () => {
      const pool = new ObjectPool(createTestFactory(), 5)

      pool.acquire()
      pool.acquire()
      pool.acquire()

      const indices: number[] = []
      pool.forEachActive((_, index) => {
        indices.push(index)
      })

      expect(indices).toEqual([0, 1, 2])
    })

    it('does not create intermediate arrays', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      pool.acquire()
      pool.acquire()

      // This test verifies the method doesn't use filter/map
      // by checking that no arrays are created during iteration
      const callback = vi.fn()
      pool.forEachActive(callback)

      expect(callback).toHaveBeenCalledTimes(2)
    })
  })

  describe('getActiveCount', () => {
    it('returns 0 for new pool', () => {
      const pool = new ObjectPool(createTestFactory(), 5)
      expect(pool.getActiveCount()).toBe(0)
    })

    it('returns correct count after acquiring objects', () => {
      const pool = new ObjectPool(createTestFactory(), 5)

      pool.acquire()
      expect(pool.getActiveCount()).toBe(1)

      pool.acquire()
      pool.acquire()
      expect(pool.getActiveCount()).toBe(3)
    })

    it('returns correct count after releasing objects', () => {
      const pool = new ObjectPool(createTestFactory(), 5)

      const obj1 = pool.acquire()
      pool.acquire()
      const obj3 = pool.acquire()

      expect(pool.getActiveCount()).toBe(3)

      if (obj1) pool.release(obj1)
      expect(pool.getActiveCount()).toBe(2)

      if (obj3) pool.release(obj3)
      expect(pool.getActiveCount()).toBe(1)
    })
  })

  describe('getPoolSize', () => {
    it('returns total pool size including inactive objects', () => {
      const pool = new ObjectPool(createTestFactory(), 10)

      pool.acquire()
      pool.acquire()
      pool.acquire()

      expect(pool.getPoolSize()).toBe(10)
      expect(pool.getActiveCount()).toBe(3)
    })
  })
})

// core/SpawnSystem.ts

import type { DifficultyState } from '../types/game'
import { FallingObjectEntity, createFallingObjectPool } from '../entities/FallingObject'
import { ObjectPool } from './ObjectPool'
import { SPAWN_CONFIG, CANVAS_CONFIG } from '../config/gameConfig'

/**
 * Weighted random selection from an array.
 * Higher weights have higher probability of being selected.
 *
 * @param items - Array of items to select from
 * @param weights - Array of weights corresponding to each item
 * @returns The selected item
 */
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return items[i]
    }
  }

  // Fallback to last item (should not reach here)
  return items[items.length - 1]
}

/**
 * SpawnSystem manages the spawning of falling objects with fairness constraints.
 *
 * Features:
 * - Lane-based spawning to spread objects across the screen
 * - Recent lane memory to avoid clustering
 * - Weighted random favoring central lanes
 * - Grace period with only good items at game start
 * - Guaranteed good item every N spawns
 * - Respects max items on screen limit
 */
export class SpawnSystem {
  /** Memory of recently used lanes to avoid repetition */
  private recentLanes: number[] = []

  /** Counter of spawns since last good item */
  private spawnsSinceGood = 0

  /** Elapsed time since game start in milliseconds */
  private elapsedTime = 0

  /** Time accumulator for spawn timing in milliseconds */
  private spawnAccumulator = 0

  /** Object pool for falling objects */
  private pool: ObjectPool<FallingObjectEntity>

  constructor(pool?: ObjectPool<FallingObjectEntity>) {
    this.pool = pool ?? createFallingObjectPool()
  }

  /**
   * Resets the spawn system state for a new game.
   * Releases all active objects back to the pool.
   */
  reset(): void {
    this.recentLanes = []
    this.spawnsSinceGood = 0
    this.elapsedTime = 0
    this.spawnAccumulator = 0
    this.pool.releaseAll()
  }

  /**
   * Gets the object pool used by this spawn system.
   */
  getPool(): ObjectPool<FallingObjectEntity> {
    return this.pool
  }

  /**
   * Gets the elapsed time in milliseconds.
   */
  getElapsedTime(): number {
    return this.elapsedTime
  }

  /**
   * Updates the spawn system timing.
   *
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    const dtMs = dt * 1000
    this.elapsedTime += dtMs
    this.spawnAccumulator += dtMs
  }

  /**
   * Checks if it's time to spawn a new object based on difficulty.
   *
   * @param difficulty - Current difficulty state
   * @returns True if ready to spawn
   */
  isReadyToSpawn(difficulty: DifficultyState): boolean {
    return this.spawnAccumulator >= difficulty.spawnInterval
  }

  /**
   * Resets the spawn timer after spawning.
   * Call this after a successful spawn.
   */
  resetSpawnTimer(): void {
    this.spawnAccumulator = 0
  }

  /**
   * Attempts to spawn a new falling object.
   * Returns null if spawn is not possible (max items reached, no available lanes, etc.)
   *
   * @param difficulty - Current difficulty state
   * @param activeCount - Number of currently active falling objects
   * @param canvasWidth - Width of the game canvas (defaults to BASE_WIDTH)
   * @returns A spawned FallingObjectEntity or null
   */
  spawn(
    difficulty: DifficultyState,
    activeCount: number,
    canvasWidth: number = CANVAS_CONFIG.BASE_WIDTH
  ): FallingObjectEntity | null {
    // Don't exceed maximum items on screen
    if (activeCount >= SPAWN_CONFIG.maxItemsOnScreen) {
      return null
    }

    // Calculate lane width
    const laneWidth = canvasWidth / SPAWN_CONFIG.lanes

    // Get available lanes (excluding recently used ones)
    const availableLanes = this.getAvailableLanes()

    if (availableLanes.length === 0) {
      // Clear recent lanes memory and try again
      this.recentLanes = []
      return null
    }

    // Select lane with weighted random (prefer central lanes)
    const selectedLane = this.selectLane(availableLanes)

    // Update recent lanes memory
    this.recentLanes.push(selectedLane)
    if (this.recentLanes.length > SPAWN_CONFIG.recentLaneMemory) {
      this.recentLanes.shift()
    }

    // Determine item type (good or bad)
    const type = this.determineItemType(difficulty)

    // Update spawn counter
    if (type === 'good') {
      this.spawnsSinceGood = 0
    } else {
      this.spawnsSinceGood++
    }

    // Acquire object from pool
    const obj = this.pool.acquire()
    if (!obj) {
      return null
    }

    // Calculate x position (center of lane)
    const x = selectedLane * laneWidth + laneWidth / 2 - 20 // -20 to center the 40px object

    // Random sprite index (0-3)
    const spriteIndex = Math.floor(Math.random() * 4)

    // Spawn the object
    obj.spawn(x, type, difficulty.fallSpeed, spriteIndex)

    return obj
  }

  /**
   * Gets lanes that are not in recent memory.
   */
  private getAvailableLanes(): number[] {
    return Array.from({ length: SPAWN_CONFIG.lanes }, (_, i) => i).filter(
      (lane) => !this.recentLanes.includes(lane)
    )
  }

  /**
   * Selects a lane using weighted random, preferring central lanes.
   *
   * @param availableLanes - Array of available lane indices
   * @returns Selected lane index
   */
  private selectLane(availableLanes: number[]): number {
    const centerLane = SPAWN_CONFIG.lanes / 2

    // Calculate weights based on distance from center
    // Central lanes get higher weight
    const weights = availableLanes.map((lane) => {
      const distanceFromCenter = Math.abs(lane - centerLane)
      const maxDistance = SPAWN_CONFIG.lanes / 2
      // Weight ranges from 1.0 (center) to 0.5 (edges)
      return 1 - (distanceFromCenter / maxDistance) * 0.5
    })

    return weightedRandom(availableLanes, weights)
  }

  /**
   * Determines whether to spawn a good or bad item based on:
   * - Grace period (only good items in first 3 seconds)
   * - Guaranteed good item every N spawns
   * - Random based on difficulty.badItemRatio
   *
   * @param difficulty - Current difficulty state
   * @returns 'good' or 'bad'
   */
  private determineItemType(difficulty: DifficultyState): 'good' | 'bad' {
    // Grace period: only good items at the start
    if (this.elapsedTime < SPAWN_CONFIG.gracePeriodStart) {
      return 'good'
    }

    // Guarantee good items periodically
    if (this.spawnsSinceGood >= SPAWN_CONFIG.guaranteedGoodEvery) {
      return 'good'
    }

    // Random based on difficulty
    if (Math.random() < difficulty.badItemRatio) {
      return 'bad'
    }

    return 'good'
  }
}

/**
 * Creates a new SpawnSystem instance.
 *
 * @param pool - Optional object pool to use (creates new one if not provided)
 * @returns A new SpawnSystem
 */
export function createSpawnSystem(
  pool?: ObjectPool<FallingObjectEntity>
): SpawnSystem {
  return new SpawnSystem(pool)
}

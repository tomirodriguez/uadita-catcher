import type { DifficultyState } from '../types/game'
import { DIFFICULTY_CONFIG } from '../config/gameConfig'

/**
 * Interpolates between min and max values using the eased progress
 */
function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}

/**
 * Applies a curve that makes difficulty progression more noticeable.
 * Uses an aggressive curve that ramps up quickly in early-mid game.
 */
function difficultyEasing(t: number): number {
  // More aggressive curve: sqrt for early acceleration
  // At t=0.25 this gives ~0.5, at t=0.5 gives ~0.71
  // This makes difficulty ramp up noticeably faster
  return Math.sqrt(t)
}

/**
 * Calculates the difficulty state based on the current score
 *
 * @param score - Current game score
 * @returns DifficultyState with level, spawnInterval, fallSpeed, and badItemRatio
 */
export function calculateDifficulty(score: number): DifficultyState {
  // Calculate level (0 to maxLevel) based on score
  // Level increases every 500 points, capped at level 20
  const level = Math.min(
    Math.floor(score / DIFFICULTY_CONFIG.scorePerLevel),
    DIFFICULTY_CONFIG.maxLevel
  )

  // Calculate linear progress (0 to 1)
  const linearProgress = level / DIFFICULTY_CONFIG.maxLevel

  // Apply easing for noticeable progression
  const easedProgress = difficultyEasing(linearProgress)

  // Interpolate all difficulty values
  return {
    level,
    spawnInterval: lerp(
      DIFFICULTY_CONFIG.initial.spawnInterval,
      DIFFICULTY_CONFIG.max.spawnInterval,
      easedProgress
    ),
    fallSpeed: lerp(
      DIFFICULTY_CONFIG.initial.fallSpeed,
      DIFFICULTY_CONFIG.max.fallSpeed,
      easedProgress
    ),
    badItemRatio: lerp(
      DIFFICULTY_CONFIG.initial.badItemRatio,
      DIFFICULTY_CONFIG.max.badItemRatio,
      easedProgress
    ),
  }
}

/**
 * Creates the initial difficulty state for a new game
 */
export function createInitialDifficultyState(): DifficultyState {
  return calculateDifficulty(0)
}

/**
 * Gets the difficulty configuration for external access
 */
export function getDifficultyConfig() {
  return {
    scorePerLevel: DIFFICULTY_CONFIG.scorePerLevel,
    maxLevel: DIFFICULTY_CONFIG.maxLevel,
    initial: { ...DIFFICULTY_CONFIG.initial },
    max: { ...DIFFICULTY_CONFIG.max },
  }
}

import type { DifficultyState } from '../types/game'

/**
 * Difficulty configuration constants
 */
const DIFFICULTY_CONFIG = {
  initial: {
    spawnInterval: 1500, // ms between spawns
    fallSpeed: 150, // pixels/second
    badItemRatio: 0.2, // 20% bad items
  },
  max: {
    spawnInterval: 400,
    fallSpeed: 400,
    badItemRatio: 0.45,
  },
  scorePerLevel: 500, // Score needed to increase level
  maxLevel: 20,
}

/**
 * Interpolates between min and max values using the eased progress
 */
function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}

/**
 * Applies logarithmic easing to a linear progress value
 * This creates a smooth, gradual curve that increases quickly at first
 * then slows down as it approaches the maximum
 */
function logarithmicEasing(t: number): number {
  // log(1 + t * (e - 1)) maps [0,1] to [0,1] with logarithmic curve
  return Math.log(1 + t * (Math.E - 1))
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

  // Apply logarithmic easing for smooth transition
  const easedProgress = logarithmicEasing(linearProgress)

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

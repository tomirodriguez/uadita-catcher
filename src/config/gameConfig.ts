// config/gameConfig.ts

/**
 * Canvas configuration for responsive scaling
 */
export const CANVAS_CONFIG = {
  BASE_WIDTH: 400,
  BASE_HEIGHT: 711,
  ASPECT_RATIO: 9 / 16,
} as const

/**
 * Player movement and dimensions configuration
 */
export const PLAYER_CONFIG = {
  maxSpeed: 500, // pixels/second
  acceleration: 2000, // pixels/second²
  deceleration: 3000, // friction
  width: 64,
  height: 64,
} as const

/**
 * Scoring configuration for items and penalties
 */
export const SCORE_CONFIG = {
  goodItem: {
    base: 10,
    perfectBonus: 1.5, // Catch in perfect zone
    saveBonus: 2.0, // Catch near ground
  },
  badItem: {
    penalty: -5,
  },
} as const

/**
 * Combo system configuration
 */
export const COMBO_CONFIG = {
  window: 2000, // ms to maintain combo
  thresholds: [
    { count: 5, multiplier: 1.5 },
    { count: 10, multiplier: 2 },
    { count: 20, multiplier: 3 },
    { count: 50, multiplier: 5 },
  ],
} as const

/**
 * Difficulty progression configuration
 */
export const DIFFICULTY_CONFIG = {
  initial: {
    spawnInterval: 1500, // ms between spawns
    fallSpeed: 250, // pixels/second
    badItemRatio: 0.25, // 25% bad items
  },
  max: {
    spawnInterval: 400,
    fallSpeed: 500,
    badItemRatio: 0.5,
  },
  scorePerLevel: 300, // Score to level up
  maxLevel: 15,
} as const

/**
 * Spawn system configuration
 */
export const SPAWN_CONFIG = {
  maxItemsOnScreen: 8,
  lanes: 6, // Divide screen into lanes
  guaranteedGoodEvery: 5, // Guarantee 1 good every N spawns
  gracePeriodStart: 2500, // ms without bad items at start
  minHorizontalGap: 60, // pixels between items
  recentLaneMemory: 2, // Avoid repeating lanes
} as const

/**
 * Lives system configuration
 */
export const LIVES_CONFIG = {
  initial: 3,
  max: 5,
  invulnerabilityDuration: 1500, // ms after losing life
  flashInterval: 100, // ms for flash effect
} as const

// Type exports for typed access
export type CanvasConfig = typeof CANVAS_CONFIG
export type PlayerConfig = typeof PLAYER_CONFIG
export type ScoreConfig = typeof SCORE_CONFIG
export type ComboConfig = typeof COMBO_CONFIG
export type DifficultyConfig = typeof DIFFICULTY_CONFIG
export type SpawnConfig = typeof SPAWN_CONFIG
export type LivesConfig = typeof LIVES_CONFIG

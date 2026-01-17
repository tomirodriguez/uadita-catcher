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
  width: 100,
  height: 100,
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
    spawnInterval: 1400, // ms between spawns
    fallSpeed: 200, // pixels/second
    badItemRatio: 0.4, // 40% bad items - starts challenging
  },
  max: {
    spawnInterval: 350,
    fallSpeed: 550,
    badItemRatio: 0.55, // 55% bad items at max
  },
  scorePerLevel: 200, // Score to level up (faster progression)
  maxLevel: 20,
} as const

/**
 * Spawn system configuration
 */
export const SPAWN_CONFIG = {
  maxItemsOnScreen: 8,
  lanes: 5, // Divide screen into lanes (reduced for larger items)
  guaranteedGoodEvery: 7, // Guarantee 1 good every N spawns (allows more bad items)
  gracePeriodStart: 1200, // ms without bad items at start (shorter grace)
  minHorizontalGap: 80, // pixels between items
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

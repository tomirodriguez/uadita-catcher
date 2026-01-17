// config/assets.ts

/**
 * Player asset configuration
 * - width/height: Visual render size
 * - hitbox: Collision detection area (smaller than visual for better feel)
 */
export const PLAYER_ASSET = {
  path: '/images/player.png',
  width: 100,
  height: 100,
  hitbox: {
    width: 70,
    height: 70,
    offsetX: 15, // Centers the hitbox: (100 - 70) / 2
    offsetY: 15,
  },
} as const

/**
 * Good item configurations
 * - width/height: Visual render size
 * - hitbox: Collision detection area
 */
export const GOOD_ITEMS = [
  { path: '/images/good_1.png', width: 64, height: 64, points: 10, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
  { path: '/images/good_2.png', width: 64, height: 64, points: 10, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
  { path: '/images/good_3.png', width: 64, height: 64, points: 10, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
  { path: '/images/good_4.png', width: 64, height: 64, points: 10, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
] as const

/**
 * Bad item configurations
 * - width/height: Visual render size
 * - hitbox: Collision detection area
 */
export const BAD_ITEMS = [
  { path: '/images/bad_1.png', width: 64, height: 64, points: -5, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
  { path: '/images/bad_2.png', width: 64, height: 64, points: -5, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
  { path: '/images/bad_3.png', width: 64, height: 64, points: -5, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
  { path: '/images/bad_4.png', width: 64, height: 64, points: -5, hitbox: { width: 44, height: 44, offsetX: 10, offsetY: 10 } },
] as const

/**
 * Sound configurations with Howler.js compatible format
 * Each sound includes webm and mp3 sources for browser compatibility
 */
export const SOUNDS = {
  // SFX - Gameplay
  catch: {
    src: ['/sounds/catch.webm', '/sounds/catch.mp3'],
    volume: 0.6,
    pool: 10,
  },
  miss: {
    src: ['/sounds/miss.webm', '/sounds/miss.mp3'],
    volume: 0.3,
    pool: 3,
  },
  badCatch: {
    src: ['/sounds/bad-catch.webm', '/sounds/bad-catch.mp3'],
    volume: 0.5,
  },
  loseLife: {
    src: ['/sounds/lose-life.webm', '/sounds/lose-life.mp3'],
    volume: 0.7,
  },

  // Combo milestones
  combo5: {
    src: ['/sounds/combo-5.webm', '/sounds/combo-5.mp3'],
    volume: 0.7,
  },
  combo10: {
    src: ['/sounds/combo-10.webm', '/sounds/combo-10.mp3'],
    volume: 0.8,
  },
  combo20: {
    src: ['/sounds/combo-20.webm', '/sounds/combo-20.mp3'],
    volume: 0.9,
  },

  // UI
  click: {
    src: ['/sounds/click.webm', '/sounds/click.mp3'],
    volume: 0.4,
  },

  // Game events
  gameOver: {
    src: ['/sounds/game-over.webm', '/sounds/game-over.mp3'],
    volume: 0.8,
  },
  highScore: {
    src: ['/sounds/high-score.webm', '/sounds/high-score.mp3'],
    volume: 0.9,
  },

  // Music
  menuMusic: {
    src: ['/sounds/menu-music.webm', '/sounds/menu-music.mp3'],
    volume: 0.3,
    loop: true,
  },
  gameMusic: {
    src: ['/sounds/game-music.webm', '/sounds/game-music.mp3'],
    volume: 0.25,
    loop: true,
  },
} as const

// Type exports for typed access
export type PlayerAsset = typeof PLAYER_ASSET
export type GoodItem = (typeof GOOD_ITEMS)[number]
export type BadItem = (typeof BAD_ITEMS)[number]
export type SoundConfig = typeof SOUNDS
export type SoundName = keyof typeof SOUNDS

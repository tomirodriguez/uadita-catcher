// config/assets.ts

/**
 * Player asset configuration
 */
export const PLAYER_ASSET = {
  path: '/assets/player.png',
  width: 64,
  height: 64,
} as const

/**
 * Good item configurations
 */
export const GOOD_ITEMS = [
  { path: '/assets/good_1.png', width: 40, height: 40, points: 10 },
  { path: '/assets/good_2.png', width: 40, height: 40, points: 10 },
  { path: '/assets/good_3.png', width: 40, height: 40, points: 10 },
  { path: '/assets/good_4.png', width: 40, height: 40, points: 10 },
] as const

/**
 * Bad item configurations
 */
export const BAD_ITEMS = [
  { path: '/assets/bad_1.png', width: 40, height: 40, points: -5 },
  { path: '/assets/bad_2.png', width: 40, height: 40, points: -5 },
  { path: '/assets/bad_3.png', width: 40, height: 40, points: -5 },
  { path: '/assets/bad_4.png', width: 40, height: 40, points: -5 },
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

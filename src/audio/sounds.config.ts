// Sound configuration for the game
// Each sound specifies sources (webm preferred, mp3 fallback), volume, and optional settings

export interface SoundConfig {
  src: string[];
  volume: number;
  loop?: boolean;
  pool?: number;
}

export const SOUNDS: Record<string, SoundConfig> = {
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
};

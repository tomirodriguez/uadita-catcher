// types/game.ts

export interface Position {
  x: number
  y: number
}

export interface Velocity {
  vx: number
  vy: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface AABB extends Position, Dimensions {}

export interface Poolable {
  active: boolean
  reset(): void
}

export interface GameObject extends Position, Dimensions {
  id: string
  velocity: Velocity
}

export interface Player extends GameObject {
  speed: number
  isInvulnerable: boolean
  invulnerabilityTimer: number
}

export interface FallingObject extends GameObject, Poolable {
  type: 'good' | 'bad'
  points: number
  spriteIndex: number
  isSaveable: boolean
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver'

export interface ComboState {
  count: number
  multiplier: number
  timer: number
  maxTimer: number
}

export interface DifficultyState {
  level: number
  spawnInterval: number
  fallSpeed: number
  badItemRatio: number
}

export interface GameState {
  status: GameStatus
  score: number
  lives: number
  maxLives: number
  player: Player
  fallingObjects: FallingObject[]
  combo: ComboState
  difficulty: DifficultyState
  elapsedTime: number
  highScore: number
}

export interface InputState {
  left: boolean
  right: boolean
  pause: boolean
}

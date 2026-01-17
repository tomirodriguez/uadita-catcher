// systems/LivesSystem.ts

import type { GameState } from '../types/game'
import { LIVES_CONFIG } from '../config/gameConfig'

/**
 * Lives system configuration with default values.
 * Uses LIVES_CONFIG from gameConfig for consistency.
 */
export const LIVES_DEFAULTS = {
  initialLives: LIVES_CONFIG.initial,
  maxLives: LIVES_CONFIG.max,
  invulnerabilityDuration: LIVES_CONFIG.invulnerabilityDuration,
} as const

/**
 * Handles losing a life when a bad item is caught.
 * Items that reach the ground do NOT cause life loss (only combo reset).
 *
 * When a life is lost:
 * - Decrements the lives counter by 1
 * - Activates invulnerability for 1500ms
 * - Sets game status to 'gameOver' if lives reach 0
 *
 * If the player is currently invulnerable, no life is lost.
 *
 * @param state - Current game state
 * @returns New game state with updated lives and invulnerability
 */
export function loseLife(state: GameState): GameState {
  // If player is invulnerable, don't lose life
  if (state.player.isInvulnerable) {
    return state
  }

  const newLives = state.lives - 1

  return {
    ...state,
    lives: newLives,
    player: {
      ...state.player,
      isInvulnerable: true,
      invulnerabilityTimer: LIVES_CONFIG.invulnerabilityDuration,
    },
    status: newLives <= 0 ? 'gameOver' : state.status,
  }
}

/**
 * Updates the invulnerability timer based on delta time.
 * When the timer reaches 0, invulnerability is disabled.
 *
 * @param state - Current game state
 * @param dt - Delta time in seconds
 * @returns New game state with updated invulnerability timer
 */
export function updateInvulnerability(
  state: GameState,
  dt: number
): GameState {
  // If not invulnerable, no update needed
  if (!state.player.isInvulnerable) {
    return state
  }

  // Convert dt from seconds to milliseconds for timer
  const dtMs = dt * 1000
  const newTimer = state.player.invulnerabilityTimer - dtMs

  // Check if invulnerability has ended
  if (newTimer <= 0) {
    return {
      ...state,
      player: {
        ...state.player,
        isInvulnerable: false,
        invulnerabilityTimer: 0,
      },
    }
  }

  // Continue invulnerability with updated timer
  return {
    ...state,
    player: {
      ...state.player,
      invulnerabilityTimer: newTimer,
    },
  }
}

/**
 * Checks if the player can lose a life.
 * Returns false if the player is currently invulnerable.
 *
 * @param state - Current game state
 * @returns true if player can lose a life, false if invulnerable
 */
export function canLoseLife(state: GameState): boolean {
  return !state.player.isInvulnerable
}

/**
 * Checks if the game is over (lives <= 0).
 *
 * @param state - Current game state
 * @returns true if game is over
 */
export function isGameOver(state: GameState): boolean {
  return state.lives <= 0 || state.status === 'gameOver'
}

/**
 * Creates initial lives state for a new game.
 *
 * @param initialLives - Number of starting lives (default from config)
 * @returns Object with initial lives values
 */
export function createInitialLivesState(
  initialLives: number = LIVES_CONFIG.initial
): {
  lives: number
  maxLives: number
} {
  return {
    lives: initialLives,
    maxLives: LIVES_CONFIG.max,
  }
}

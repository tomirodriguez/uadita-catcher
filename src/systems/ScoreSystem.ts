// systems/ScoreSystem.ts

import type { FallingObject, GameState } from '../types/game'
import type { CollisionType } from '../core/CollisionSystem'
import { SCORE_CONFIG } from '../config/gameConfig'

/**
 * Catch type describing how an item was caught.
 * - 'normal': Standard catch within catch zone
 * - 'perfect': Catch in the center perfect zone (x1.5 bonus)
 * - 'save': Catch near the ground when isSaveable is true (x2.0 bonus)
 */
export type CatchType = CollisionType | 'save'

/**
 * Calculates the score for catching an item based on item type,
 * catch type (normal/perfect/save), and current combo multiplier.
 *
 * Scoring rules:
 * - Good item base: 10 points
 * - Perfect catch bonus: x1.5
 * - Save catch bonus (near ground): x2.0
 * - Bad item penalty: -5 points
 * - All points are multiplied by combo multiplier
 * - Final score is never negative (minimum 0)
 *
 * @param item - The falling object that was caught
 * @param catchType - How the item was caught (normal, perfect, or save)
 * @param comboMultiplier - Current combo multiplier (1.0 to 5.0)
 * @returns The calculated score (always >= 0)
 */
export function calculateScore(
  item: FallingObject,
  catchType: CatchType,
  comboMultiplier: number
): number {
  // Handle bad items - penalty without any bonuses
  if (item.type === 'bad') {
    // Bad items get negative penalty, not affected by catch type
    // But still multiplied by combo (penalty increases with combo)
    const penalty = SCORE_CONFIG.badItem.penalty * comboMultiplier
    // Ensure score never goes below 0
    return Math.max(0, Math.floor(penalty))
  }

  // Calculate good item score with bonuses
  let points = SCORE_CONFIG.goodItem.base

  // Apply catch type bonuses
  if (catchType === 'perfect') {
    points *= SCORE_CONFIG.goodItem.perfectBonus
  }

  if (catchType === 'save') {
    points *= SCORE_CONFIG.goodItem.saveBonus
  }

  // Apply combo multiplier
  points *= comboMultiplier

  // Return floored result (always positive for good items)
  return Math.floor(points)
}

/**
 * Updates the game state with new points added to the score.
 * Ensures the score never goes below 0.
 *
 * @param state - Current game state
 * @param points - Points to add (can be negative for penalties)
 * @returns New game state with updated score
 */
export function updateScore(state: GameState, points: number): GameState {
  const newScore = Math.max(0, state.score + points)

  return {
    ...state,
    score: newScore,
  }
}

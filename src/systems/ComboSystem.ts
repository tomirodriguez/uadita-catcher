// systems/ComboSystem.ts

import type { ComboState } from '../types/game'
import { COMBO_CONFIG, SCORE_CONFIG } from '../config/gameConfig'

/**
 * Manages the combo system including combo count, multipliers, and timer decay.
 * The combo system rewards consecutive successful catches with score multipliers.
 */
export class ComboSystem {
  private state: ComboState = {
    count: 0,
    multiplier: 1,
    timer: 0,
    maxTimer: COMBO_CONFIG.window,
  }

  /**
   * Registers a successful hit (catching a good item).
   * Increments combo count, resets the timer, updates multiplier if threshold reached,
   * and calculates the final score with all bonuses applied.
   *
   * @param isPerfect - Whether the catch was in the perfect zone (center of player)
   * @param isSave - Whether the catch was near the ground (save zone)
   * @returns The calculated score with all multipliers applied
   */
  hit(isPerfect: boolean, isSave: boolean): number {
    this.state.count++
    this.state.timer = this.state.maxTimer

    // Update multiplier if we reached a threshold
    for (const threshold of COMBO_CONFIG.thresholds) {
      if (this.state.count >= threshold.count) {
        this.state.multiplier = threshold.multiplier
      }
    }

    // Calculate base score with bonuses
    let points = SCORE_CONFIG.goodItem.base

    if (isPerfect) {
      points *= SCORE_CONFIG.goodItem.perfectBonus
    }

    if (isSave) {
      points *= SCORE_CONFIG.goodItem.saveBonus
    }

    // Apply combo multiplier and return floored result
    return Math.floor(points * this.state.multiplier)
  }

  /**
   * Resets the combo when the player misses or catches a bad item.
   * Sets count to 0 and multiplier back to 1.
   */
  miss(): void {
    this.state.count = 0
    this.state.multiplier = 1
    this.state.timer = 0
  }

  /**
   * Updates the combo timer. Should be called each frame.
   * When the timer reaches 0, the combo is reset via miss().
   *
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    if (this.state.timer > 0) {
      // Convert dt from seconds to milliseconds for timer comparison
      this.state.timer -= dt * 1000

      if (this.state.timer <= 0) {
        this.state.timer = 0
        this.miss()
      }
    }
  }

  /**
   * Gets the current combo count.
   */
  get comboCount(): number {
    return this.state.count
  }

  /**
   * Gets the current score multiplier.
   */
  get multiplier(): number {
    return this.state.multiplier
  }

  /**
   * Gets the remaining timer as a percentage (0 to 1).
   * Useful for displaying a combo timer bar in the UI.
   */
  get timerPercent(): number {
    if (this.state.maxTimer === 0) return 0
    return Math.max(0, this.state.timer / this.state.maxTimer)
  }

  /**
   * Gets a copy of the current combo state.
   * Useful for saving/restoring state or debugging.
   */
  getState(): ComboState {
    return { ...this.state }
  }

  /**
   * Resets the combo system to its initial state.
   */
  reset(): void {
    this.state = {
      count: 0,
      multiplier: 1,
      timer: 0,
      maxTimer: COMBO_CONFIG.window,
    }
  }
}

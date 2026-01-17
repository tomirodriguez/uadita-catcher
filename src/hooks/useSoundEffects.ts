// hooks/useSoundEffects.ts

import { useCallback, useEffect, useRef } from 'react'
import { soundManager } from '../audio/SoundManager'
import type { GameStatus } from '../types/game'

/**
 * Combo milestone thresholds for triggering combo sounds.
 */
const COMBO_MILESTONES = [5, 10, 20] as const

/**
 * Hook that provides sound effect callbacks for game events.
 * Integrates with the SoundManager to play appropriate sounds
 * based on gameplay actions and state changes.
 */
export function useSoundEffects() {
  const lastComboMilestoneRef = useRef<number>(0)
  const currentMusicRef = useRef<string | null>(null)

  /**
   * Play catch sound with pitch variation for variety.
   */
  const playCatch = useCallback(() => {
    soundManager.playVaried('catch', 0.15)
  }, [])

  /**
   * Play bad catch sound when catching a bad item.
   */
  const playBadCatch = useCallback(() => {
    soundManager.play('badCatch')
  }, [])

  /**
   * Play subtle miss sound when a good item reaches the ground.
   */
  const playMiss = useCallback(() => {
    soundManager.play('miss')
  }, [])

  /**
   * Play lose life sound when player loses a life.
   */
  const playLoseLife = useCallback(() => {
    soundManager.play('loseLife')
  }, [])

  /**
   * Play game over sound.
   */
  const playGameOver = useCallback(() => {
    soundManager.play('gameOver')
  }, [])

  /**
   * Play high score sound when achieving a new record.
   */
  const playHighScore = useCallback(() => {
    soundManager.play('highScore')
  }, [])

  /**
   * Play UI click sound for buttons.
   */
  const playClick = useCallback(() => {
    soundManager.play('click')
  }, [])

  /**
   * Check and play combo milestone sounds.
   * Plays combo5, combo10, or combo20 when hitting those milestones exactly.
   *
   * @param comboCount - Current combo count
   */
  const checkComboMilestone = useCallback((comboCount: number) => {
    // Check if we hit a milestone exactly
    for (const milestone of COMBO_MILESTONES) {
      if (comboCount === milestone && lastComboMilestoneRef.current < milestone) {
        const soundName = `combo${milestone}` as 'combo5' | 'combo10' | 'combo20'
        soundManager.play(soundName)
        lastComboMilestoneRef.current = milestone
        break
      }
    }

    // Reset tracking if combo was reset
    if (comboCount === 0) {
      lastComboMilestoneRef.current = 0
    }
  }, [])

  /**
   * Reset combo milestone tracking (call when combo is reset).
   */
  const resetComboMilestone = useCallback(() => {
    lastComboMilestoneRef.current = 0
  }, [])

  /**
   * Switch background music based on game status.
   * Uses crossfade for smooth transitions.
   *
   * @param status - Current game status
   */
  const updateMusic = useCallback((status: GameStatus) => {
    const targetMusic = status === 'menu' ? 'menuMusic' : status === 'playing' ? 'gameMusic' : null

    if (targetMusic && targetMusic !== currentMusicRef.current) {
      soundManager.playMusic(targetMusic, 1000)
      currentMusicRef.current = targetMusic
    } else if (!targetMusic && currentMusicRef.current) {
      soundManager.stopMusic(1000)
      currentMusicRef.current = null
    }
  }, [])

  /**
   * Stop all music (for game over or cleanup).
   */
  const stopMusic = useCallback(() => {
    soundManager.stopMusic(500)
    currentMusicRef.current = null
  }, [])

  return {
    // Gameplay sounds
    playCatch,
    playBadCatch,
    playMiss,
    playLoseLife,
    playGameOver,
    playHighScore,

    // UI sounds
    playClick,

    // Combo system
    checkComboMilestone,
    resetComboMilestone,

    // Music control
    updateMusic,
    stopMusic,
  }
}

/**
 * Hook to preload all game sounds on mount.
 * Should be called once at the app root level.
 */
export function usePreloadSounds() {
  const hasPreloaded = useRef(false)

  useEffect(() => {
    if (hasPreloaded.current) return
    hasPreloaded.current = true

    soundManager.preload().catch((error) => {
      console.warn('Failed to preload sounds:', error)
    })
  }, [])
}

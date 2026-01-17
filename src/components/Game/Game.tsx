// components/Game/Game.tsx

import { useRef, useState, useEffect, useCallback } from 'react'
import type { GameState, GameStatus, InputState } from '../../types/game'

// Core systems
import { GameLoop } from '../../core/GameLoop'
import { SpawnSystem } from '../../core/SpawnSystem'
import { checkCollisions } from '../../core/CollisionSystem'

// Game systems
import { ComboSystem } from '../../systems/ComboSystem'
import { calculateDifficulty, createInitialDifficultyState } from '../../systems/DifficultySystem'
import { updatePlayerMovement, updateFallingObjects } from '../../systems/MovementSystem'
import { loseLife, updateInvulnerability, createInitialLivesState } from '../../systems/LivesSystem'
import { ScreenShake, FloatingTextManager } from '../../systems/FeedbackSystem'

// Entities
import { createPlayer, loadPlayerImage, renderPlayer } from '../../entities/Player'
import {
  loadFallingObjectImages,
  renderFallingObject,
  type FallingObjectEntity,
} from '../../entities/FallingObject'

// Components
import { GameCanvas, type GameCanvasHandle } from './GameCanvas'
import { ScoreDisplay } from '../HUD/ScoreDisplay'
import { LivesDisplay } from '../HUD/LivesDisplay'
import { ComboIndicator } from '../HUD/ComboIndicator'
import { DebugPanel } from '../HUD/DebugPanel'
import { MainMenu } from '../Menu/MainMenu'
import { PauseMenu } from '../Menu/PauseMenu'
import { GameOverScreen } from '../Menu/GameOverScreen'

// Hooks
import { useInput } from '../../hooks/useInput'
import { useTouchControls } from '../../hooks/useTouchControls'
import { useSoundEffects, usePreloadSounds } from '../../hooks/useSoundEffects'

// Config & Utils
import { CANVAS_CONFIG, SCORE_CONFIG } from '../../config/gameConfig'
import { getHighScore, recordGamePlayed } from '../../utils/storage'

/**
 * Creates the initial game state for a new game.
 */
function createInitialGameState(highScore: number): GameState {
  const livesState = createInitialLivesState()
  return {
    status: 'menu',
    score: 0,
    lives: livesState.lives,
    maxLives: livesState.maxLives,
    player: createPlayer(),
    fallingObjects: [],
    combo: {
      count: 0,
      multiplier: 1,
      timer: 0,
      maxTimer: 2000,
    },
    difficulty: createInitialDifficultyState(),
    elapsedTime: 0,
    highScore,
  }
}

/**
 * Main Game component that orchestrates all game systems.
 * Uses useRef for game state to avoid unnecessary re-renders.
 * Uses useState only for UI elements that need to trigger re-renders.
 */
export function Game() {
  // Canvas ref for rendering
  const canvasRef = useRef<GameCanvasHandle>(null)

  // Game state stored in ref to avoid re-renders during gameplay
  const gameStateRef = useRef<GameState>(createInitialGameState(getHighScore()))

  // Previous positions for interpolation
  const prevPlayerXRef = useRef<number>(0)
  const prevObjectYsRef = useRef<Map<string, number>>(new Map())

  // Core systems (persistent across game restarts)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const spawnSystemRef = useRef<SpawnSystem>(new SpawnSystem())
  const comboSystemRef = useRef<ComboSystem>(new ComboSystem())
  const screenShakeRef = useRef<ScreenShake>(new ScreenShake())
  const floatingTextRef = useRef<FloatingTextManager>(new FloatingTextManager())

  // UI state that triggers re-renders
  const [uiState, setUiState] = useState({
    status: 'menu' as GameStatus,
    score: 0,
    lives: 3,
    maxLives: 5,
    isInvulnerable: false,
    comboCount: 0,
    multiplier: 1,
    timerPercent: 0,
    highScore: getHighScore(),
    isNewHighScore: false,
    difficulty: createInitialDifficultyState(),
    elapsedTime: 0,
  })

  // Input handling
  const { input: keyboardInput, consumePause } = useInput()
  const touchInput = useTouchControls()

  // Sound effects
  const sounds = useSoundEffects()
  usePreloadSounds()

  // Store input in a ref so the game loop always has access to current input
  const inputRef = useRef<InputState>({ left: false, right: false, pause: false })

  // Update input ref whenever keyboard or touch input changes
  useEffect(() => {
    inputRef.current = {
      left: keyboardInput.left || touchInput.left,
      right: keyboardInput.right || touchInput.right,
      pause: keyboardInput.pause,
    }
  }, [keyboardInput, touchInput])

  // Combined input state - reads from ref for current values
  const getInputState = useCallback((): InputState => {
    return inputRef.current
  }, [])

  /**
   * Synchronizes game state ref with UI state for display updates.
   */
  const syncUiState = useCallback(() => {
    const state = gameStateRef.current
    const combo = comboSystemRef.current

    setUiState((prev) => ({
      ...prev,
      status: state.status,
      score: state.score,
      lives: state.lives,
      maxLives: state.maxLives,
      isInvulnerable: state.player.isInvulnerable,
      comboCount: combo.comboCount,
      multiplier: combo.multiplier,
      timerPercent: combo.timerPercent,
      highScore: state.highScore,
      difficulty: state.difficulty,
      elapsedTime: state.elapsedTime,
    }))
  }, [])

  /**
   * Resets the game for a new play session.
   */
  const resetGame = useCallback(() => {
    const highScore = gameStateRef.current.highScore
    gameStateRef.current = createInitialGameState(highScore)
    gameStateRef.current.status = 'playing'

    // Reset all systems
    spawnSystemRef.current.reset()
    comboSystemRef.current.reset()
    screenShakeRef.current.stop()
    floatingTextRef.current.clear()

    // Clear previous positions
    prevPlayerXRef.current = gameStateRef.current.player.x
    prevObjectYsRef.current.clear()

    // Reset combo milestone tracking
    sounds.resetComboMilestone()

    syncUiState()
  }, [sounds, syncUiState])

  /**
   * Game update function - called at fixed timestep (60 FPS).
   */
  const update = useCallback(
    (dt: number) => {
      const state = gameStateRef.current
      if (state.status !== 'playing') return

      const input = getInputState()

      // Handle pause
      if (input.pause) {
        consumePause() // Consume the pause input so it doesn't trigger again
        gameStateRef.current = { ...state, status: 'paused' }
        gameLoopRef.current?.stop()
        syncUiState()
        return
      }

      // Store previous positions for interpolation
      prevPlayerXRef.current = state.player.x
      const pool = spawnSystemRef.current.getPool()
      pool.forEachActive((obj: FallingObjectEntity) => {
        prevObjectYsRef.current.set(obj.id, obj.y)
      })

      // Update player movement
      updatePlayerMovement(state.player, input, dt)

      // Update falling objects
      const activeObjects: FallingObjectEntity[] = []
      pool.forEachActive((obj: FallingObjectEntity) => {
        activeObjects.push(obj)
      })

      // Track objects before update for missed detection
      const objectsNearBottom = activeObjects.filter(
        (obj) => obj.y + obj.height >= CANVAS_CONFIG.BASE_HEIGHT - 10 && obj.type === 'good'
      )

      updateFallingObjects(
        activeObjects,
        pool,
        state.difficulty,
        dt,
        CANVAS_CONFIG.BASE_HEIGHT
      )

      // Check for missed good items (objects that left the screen)
      for (const obj of objectsNearBottom) {
        if (!obj.active && obj.type === 'good') {
          // Good item was missed
          sounds.playMiss()

          if (!state.player.isInvulnerable) {
            sounds.playLoseLife()
            gameStateRef.current = loseLife(state)

            // Add screen shake for losing life
            screenShakeRef.current.shake(8)

            // Check for game over
            if (gameStateRef.current.status === 'gameOver') {
              gameLoopRef.current?.stop()

              // Record game and check for high score
              const isNewHighScore = gameStateRef.current.score > gameStateRef.current.highScore
              if (isNewHighScore) {
                gameStateRef.current.highScore = gameStateRef.current.score
              }
              recordGamePlayed(gameStateRef.current.score)

              setUiState((prev) => ({
                ...prev,
                status: 'gameOver',
                isNewHighScore,
                highScore: gameStateRef.current.highScore,
              }))
              return
            }
          }

          // Reset combo on miss
          comboSystemRef.current.miss()
          sounds.resetComboMilestone()
        }
      }

      // Update invulnerability timer
      gameStateRef.current = updateInvulnerability(gameStateRef.current, dt)

      // Update combo timer
      comboSystemRef.current.update(dt)

      // Update spawn system timing
      spawnSystemRef.current.update(dt)
      gameStateRef.current.elapsedTime = spawnSystemRef.current.getElapsedTime()

      // Spawn new objects if ready
      if (spawnSystemRef.current.isReadyToSpawn(state.difficulty)) {
        const activeCount = pool.getActiveCount()
        const newObj = spawnSystemRef.current.spawn(state.difficulty, activeCount)
        if (newObj) {
          spawnSystemRef.current.resetSpawnTimer()
        }
      }

      // Get current active objects for collision
      const currentActiveObjects: FallingObjectEntity[] = []
      pool.forEachActive((obj: FallingObjectEntity) => {
        currentActiveObjects.push(obj)
      })

      // Check collisions (with neutral zone at bottom)
      const collisions = checkCollisions(state.player, currentActiveObjects, CANVAS_CONFIG.BASE_HEIGHT)

      for (const collision of collisions) {
        const obj = collision.object as FallingObjectEntity
        const isPerfect = collision.type === 'perfect'
        const isSave = obj.isSaveable

        if (obj.type === 'good') {
          // Calculate score
          const points = comboSystemRef.current.hit(isPerfect, isSave)
          gameStateRef.current.score += points

          // Track previous level before updating difficulty
          const previousLevel = gameStateRef.current.difficulty.level

          // Update difficulty based on new score
          gameStateRef.current.difficulty = calculateDifficulty(gameStateRef.current.score)

          // Check for level up
          const newLevel = gameStateRef.current.difficulty.level
          if (newLevel > previousLevel) {
            // Show level up message in center of screen
            floatingTextRef.current.spawnLevelUp(
              newLevel,
              CANVAS_CONFIG.BASE_WIDTH / 2,
              CANVAS_CONFIG.BASE_HEIGHT / 2
            )
            screenShakeRef.current.shake(6)
          }

          // Play sounds
          sounds.playCatch()
          sounds.checkComboMilestone(comboSystemRef.current.comboCount)

          // Add visual feedback
          const feedbackX = obj.x + obj.width / 2
          const feedbackY = obj.y

          if (isPerfect) {
            floatingTextRef.current.spawnPerfectCatch(points, feedbackX, feedbackY)
          } else {
            floatingTextRef.current.spawnGoodCatch(points, feedbackX, feedbackY)
          }

          // Screen shake for catches
          screenShakeRef.current.shake(isPerfect ? 4 : 2)

          // Spawn combo text at milestones
          const comboCount = comboSystemRef.current.comboCount
          if (comboCount === 5 || comboCount === 10 || comboCount === 20 || comboCount === 50) {
            floatingTextRef.current.spawnCombo(comboCount, feedbackX, feedbackY - 30)
            screenShakeRef.current.shake(10)
          }
        } else {
          // Bad item caught
          // bad_1 (index 0), bad_2 (index 1): -50 points + lose life
          // bad_3 (index 2), bad_4 (index 3): lose ALL points + lose life
          const isMajorBad = obj.spriteIndex >= 2 // bad_3 or bad_4
          const penalty = isMajorBad
            ? gameStateRef.current.score // Lose ALL points
            : SCORE_CONFIG.badItem.minorPenalty // Lose 50 points

          gameStateRef.current.score = Math.max(0, gameStateRef.current.score - penalty)

          // Play bad catch sound
          sounds.playBadCatch()

          // Reset combo
          comboSystemRef.current.miss()
          sounds.resetComboMilestone()

          // Lose a life (if not invulnerable)
          if (!gameStateRef.current.player.isInvulnerable) {
            sounds.playLoseLife()
            gameStateRef.current = loseLife(gameStateRef.current)

            // Check for game over
            if (gameStateRef.current.status === 'gameOver') {
              gameLoopRef.current?.stop()

              // Record game and check for high score
              const isNewHighScore = gameStateRef.current.score > gameStateRef.current.highScore
              if (isNewHighScore) {
                gameStateRef.current.highScore = gameStateRef.current.score
              }
              recordGamePlayed(gameStateRef.current.score)

              setUiState((prev) => ({
                ...prev,
                status: 'gameOver',
                isNewHighScore,
                highScore: gameStateRef.current.highScore,
              }))

              // Release the object and return early
              pool.release(obj)
              return
            }
          }

          // Add visual feedback
          floatingTextRef.current.spawnBadCatch(
            penalty,
            obj.x + obj.width / 2,
            obj.y
          )

          // Screen shake for bad catch (stronger for major bad items)
          screenShakeRef.current.shake(isMajorBad ? 10 : 6)
        }

        // Release the object back to pool
        pool.release(obj)
      }

      // Update floating text animations
      floatingTextRef.current.update(dt)

      // Sync UI state periodically (every update for smooth display)
      syncUiState()
    },
    [consumePause, getInputState, sounds, syncUiState]
  )

  /**
   * Game render function - called each frame with interpolation alpha.
   */
  const render = useCallback((alpha: number) => {
    const canvasHandle = canvasRef.current
    if (!canvasHandle?.canvas || !canvasHandle.context) return

    const ctx = canvasHandle.context
    const state = gameStateRef.current
    if (state.status !== 'playing' && state.status !== 'paused') return

    // Clear canvas with background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_CONFIG.BASE_WIDTH, CANVAS_CONFIG.BASE_HEIGHT)

    // Get screen shake offset
    const shakeOffset = screenShakeRef.current.update()

    // Apply screen shake
    ctx.save()
    ctx.translate(shakeOffset.x, shakeOffset.y)

    // Render falling objects with interpolation
    const pool = spawnSystemRef.current.getPool()
    pool.forEachActive((obj: FallingObjectEntity) => {
      const prevY = prevObjectYsRef.current.get(obj.id)
      renderFallingObject(ctx, obj, alpha, prevY)
    })

    // Render player with interpolation
    renderPlayer(ctx, state.player, alpha, prevPlayerXRef.current)

    // Restore after shake
    ctx.restore()

    // Render floating text (not affected by shake)
    floatingTextRef.current.render(ctx)
  }, [])

  /**
   * Starts the game loop.
   */
  const startGameLoop = useCallback(() => {
    if (!gameLoopRef.current) {
      gameLoopRef.current = new GameLoop()
    }

    gameLoopRef.current.setUpdate(update)
    gameLoopRef.current.setRender(render)
    gameLoopRef.current.start()
  }, [update, render])

  /**
   * Handler for starting a new game from menu.
   */
  const handleStartGame = useCallback(() => {
    resetGame()
    sounds.updateMusic('playing')
    startGameLoop()
  }, [resetGame, sounds, startGameLoop])

  /**
   * Handler for resuming from pause.
   */
  const handleResume = useCallback(() => {
    gameStateRef.current.status = 'playing'
    syncUiState()
    startGameLoop()
  }, [syncUiState, startGameLoop])

  /**
   * Handler for quitting to main menu.
   */
  const handleQuit = useCallback(() => {
    gameLoopRef.current?.stop()

    // Record the game if we have a score
    if (gameStateRef.current.score > 0) {
      recordGamePlayed(gameStateRef.current.score)
    }

    // Reset to menu state
    const highScore = Math.max(gameStateRef.current.highScore, gameStateRef.current.score)
    gameStateRef.current = createInitialGameState(highScore)
    gameStateRef.current.status = 'menu'

    // Reset systems
    spawnSystemRef.current.reset()
    comboSystemRef.current.reset()
    screenShakeRef.current.stop()
    floatingTextRef.current.clear()

    setUiState((prev) => ({
      ...prev,
      status: 'menu',
      highScore,
      isNewHighScore: false,
    }))

    sounds.updateMusic('menu')
  }, [sounds])

  /**
   * Handler for playing again from game over.
   */
  const handlePlayAgain = useCallback(() => {
    handleStartGame()
  }, [handleStartGame])

  /**
   * Handler for returning to main menu from game over.
   */
  const handleMainMenu = useCallback(() => {
    handleQuit()
  }, [handleQuit])

  // Load assets on mount
  useEffect(() => {
    Promise.all([loadPlayerImage(), loadFallingObjectImages()]).catch((error) => {
      console.warn('Failed to load some game assets:', error)
    })

    // Cleanup on unmount
    return () => {
      gameLoopRef.current?.stop()
    }
  }, [])

  // Handle pause input when playing (for keyboard pause during gameplay)
  useEffect(() => {
    if (
      keyboardInput.pause &&
      gameStateRef.current.status === 'paused' &&
      gameLoopRef.current &&
      !gameLoopRef.current.getIsRunning()
    ) {
      // Pause menu handles its own escape key
    }
  }, [keyboardInput.pause])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0a0a0f',
      }}
    >
      {/* Game Canvas - always rendered for background */}
      <GameCanvas ref={canvasRef} />

      {/* HUD - only shown during gameplay */}
      {(uiState.status === 'playing' || uiState.status === 'paused') && (
        <>
          <ScoreDisplay score={uiState.score} />
          <LivesDisplay
            lives={uiState.lives}
            maxLives={uiState.maxLives}
            isInvulnerable={uiState.isInvulnerable}
          />
          <ComboIndicator
            comboCount={uiState.comboCount}
            multiplier={uiState.multiplier}
            timerPercent={uiState.timerPercent}
          />
          <DebugPanel
            difficulty={uiState.difficulty}
            score={uiState.score}
            elapsedTime={uiState.elapsedTime}
          />
        </>
      )}

      {/* Main Menu */}
      {uiState.status === 'menu' && (
        <MainMenu highScore={uiState.highScore} onStartGame={handleStartGame} />
      )}

      {/* Pause Menu */}
      {uiState.status === 'paused' && (
        <PauseMenu onResume={handleResume} onQuit={handleQuit} />
      )}

      {/* Game Over Screen */}
      {uiState.status === 'gameOver' && (
        <GameOverScreen
          score={uiState.score}
          highScore={uiState.highScore}
          isNewHighScore={uiState.isNewHighScore}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  )
}

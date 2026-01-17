# Catch Game - Product Requirements Document

## Resumen Ejecutivo

**Catch Game** es un juego arcade web donde el jugador controla una canasta/personaje en la parte inferior de la pantalla para atrapar objetos buenos que caen mientras evita los malos.

| Aspecto | Detalle |
|---------|---------|
| **Plataforma** | Web (Desktop + Mobile) |
| **Stack** | React 18+, TypeScript 5+, Vite 5+, HTML5 Canvas |
| **Orientación** | Portrait (recomendado para móvil) |
| **Target FPS** | 60fps estable |
| **Bundle Size** | < 500KB gzipped |

---

## 1. Arquitectura Técnica

### 1.1 Stack Tecnológico

```
Runtime:        Bun / Node.js
Framework:      React 19+
Language:       TypeScript 5+
Bundler:        Vite 6+
Rendering:      HTML5 Canvas (gameplay) + React (UI)
Audio:          Howler.js 2.x
Styling:        TailwindCSS / CSS Modules
```

### 1.2 Estructura del Proyecto

```
src/
├── components/
│   ├── Game/
│   │   ├── Game.tsx           # Componente principal con Canvas
│   │   ├── GameCanvas.tsx     # Canvas layer para gameplay
│   │   └── GameUI.tsx         # React overlay para HUD
│   ├── Menu/
│   │   ├── MainMenu.tsx
│   │   ├── PauseMenu.tsx
│   │   └── GameOverScreen.tsx
│   ├── HUD/
│   │   ├── ScoreDisplay.tsx
│   │   ├── LivesDisplay.tsx
│   │   └── ComboIndicator.tsx
│   └── Settings/
│       ├── AudioSettings.tsx
│       └── AccessibilitySettings.tsx
├── core/
│   ├── GameLoop.ts            # Fixed timestep game loop
│   ├── ObjectPool.ts          # Object pooling para GC-friendly
│   ├── CollisionSystem.ts     # AABB collision detection
│   └── SpawnSystem.ts         # Item spawn logic
├── entities/
│   ├── Player.ts
│   └── FallingObject.ts
├── systems/
│   ├── MovementSystem.ts
│   ├── RenderSystem.ts
│   ├── ScoreSystem.ts
│   ├── ComboSystem.ts
│   └── DifficultySystem.ts
├── hooks/
│   ├── useGameLoop.ts
│   ├── useInput.ts
│   ├── useAudioManager.ts
│   └── useGameState.ts
├── audio/
│   ├── SoundManager.ts
│   └── sounds.config.ts
├── config/
│   ├── gameConfig.ts          # Configuración del juego
│   ├── difficultyConfig.ts    # Curvas de dificultad
│   └── assets.ts              # Paths de assets
├── types/
│   └── game.ts
├── utils/
│   ├── math.ts
│   ├── easing.ts
│   └── storage.ts
└── assets/
    ├── images/
    │   ├── player.png
    │   ├── good_1.png ... good_4.png
    │   └── bad_1.png ... bad_4.png
    └── sounds/
```

### 1.3 Game Loop - Fixed Timestep con Interpolación

El game loop usa **fixed timestep** (60 updates/segundo) con interpolación para render suave:

```typescript
const TIMESTEP = 1000 / 60; // ~16.67ms
const MAX_FRAME_TIME = 250; // Previene "spiral of death"

class GameLoop {
  private accumulator = 0;
  private previousState: GameState;

  loop(timestamp: number): void {
    let frameTime = timestamp - this.lastTimestamp;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    this.accumulator += frameTime;
    this.lastTimestamp = timestamp;

    // Fixed timestep updates (física/lógica)
    while (this.accumulator >= TIMESTEP) {
      this.previousState = structuredClone(this.state);
      this.update(TIMESTEP);
      this.accumulator -= TIMESTEP;
    }

    // Interpolación para render suave
    const alpha = this.accumulator / TIMESTEP;
    this.render(alpha);

    requestAnimationFrame(this.loop.bind(this));
  }
}
```

**Beneficios**:
- Física consistente independiente del frame rate
- Funciona en 30fps, 60fps, 120fps, 144fps
- Interpolación elimina stuttering visual

### 1.4 Object Pooling

Para evitar garbage collection stutters, usar object pooling para objetos que caen:

```typescript
class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 50) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  acquire(): T | null {
    for (const obj of this.pool) {
      if (!obj.active) {
        obj.active = true;
        obj.reset();
        return obj;
      }
    }
    // Expandir pool si es necesario
    if (this.pool.length < 200) {
      const newObj = this.factory();
      newObj.active = true;
      this.pool.push(newObj);
      return newObj;
    }
    return null;
  }

  release(obj: T): void {
    obj.active = false;
    obj.reset();
  }
}
```

---

## 2. Interfaces TypeScript

```typescript
// types/game.ts

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  vx: number;
  vy: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface AABB extends Position, Dimensions {}

interface Poolable {
  active: boolean;
  reset(): void;
}

interface GameObject extends Position, Dimensions {
  id: string;
  velocity: Velocity;
}

interface Player extends GameObject {
  speed: number;
  isInvulnerable: boolean;
  invulnerabilityTimer: number;
}

interface FallingObject extends GameObject, Poolable {
  type: 'good' | 'bad';
  points: number;
  spriteIndex: number;
  isSaveable: boolean; // Near ground, can still catch
}

type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver';

interface ComboState {
  count: number;
  multiplier: number;
  timer: number;
  maxTimer: number;
}

interface DifficultyState {
  level: number;
  spawnInterval: number;
  fallSpeed: number;
  badItemRatio: number;
}

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  player: Player;
  fallingObjects: FallingObject[];
  combo: ComboState;
  difficulty: DifficultyState;
  elapsedTime: number;
  highScore: number;
}

interface InputState {
  left: boolean;
  right: boolean;
  pause: boolean;
}
```

---

## 3. Sistema de Colisiones

### 3.1 AABB (Axis-Aligned Bounding Box)

Método simple y eficiente para detección de colisiones:

```typescript
function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

interface CollisionResult {
  colliding: boolean;
  overlapX: number;
  overlapY: number;
}

function getCollisionInfo(a: AABB, b: AABB): CollisionResult {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  return {
    colliding: overlapX > 0 && overlapY > 0,
    overlapX: Math.max(0, overlapX),
    overlapY: Math.max(0, overlapY),
  };
}
```

### 3.2 Collision Zones

Para mejorar game feel, usar múltiples zonas de colisión:

```
┌─────────────────────────────┐
│      CATCH ZONE (grande)    │ ← Área donde cuenta como "catch"
│  ┌───────────────────────┐  │
│  │   PERFECT ZONE        │  │ ← Bonus por catch perfecto
│  │   (centro del player) │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

```typescript
const CATCH_ZONE_PADDING = 10; // pixels extra de tolerancia
const PERFECT_ZONE_SIZE = 0.5; // 50% del tamaño del player

function getCatchZone(player: Player): AABB {
  return {
    x: player.x - CATCH_ZONE_PADDING,
    y: player.y - CATCH_ZONE_PADDING,
    width: player.width + CATCH_ZONE_PADDING * 2,
    height: player.height + CATCH_ZONE_PADDING * 2,
  };
}
```

---

## 4. Sistema de Controles

### 4.1 Hook useInput

```typescript
interface InputConfig {
  keyboardEnabled: boolean;
  touchEnabled: boolean;
}

function useInput(config: InputConfig): InputState {
  const [input, setInput] = useState<InputState>({
    left: false,
    right: false,
    pause: false,
  });

  // Keyboard
  useEffect(() => {
    if (!config.keyboardEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setInput(prev => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setInput(prev => ({ ...prev, right: true }));
          break;
        case 'Escape':
        case ' ':
          setInput(prev => ({ ...prev, pause: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Similar logic for keyup
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config.keyboardEnabled]);

  return input;
}
```

### 4.2 Touch Controls

Zonas táctiles divididas (mitad izquierda/derecha):

```typescript
function useTouchControls(canvasRef: RefObject<HTMLCanvasElement>) {
  const [touchInput, setTouchInput] = useState({ left: false, right: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const screenMiddle = window.innerWidth / 2;

      setTouchInput({
        left: touch.clientX < screenMiddle,
        right: touch.clientX >= screenMiddle,
      });
    };

    const handleTouchEnd = () => {
      setTouchInput({ left: false, right: false });
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [canvasRef]);

  return touchInput;
}
```

### 4.3 Prevenir Zoom/Scroll en Móvil

```css
/* styles.css */
html, body {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

.game-canvas {
  touch-action: none;
}
```

---

## 5. Sistema de Movimiento

### 5.1 Player Movement con Easing

```typescript
const PLAYER_CONFIG = {
  maxSpeed: 500,        // pixels/segundo
  acceleration: 2000,   // pixels/segundo²
  deceleration: 3000,   // fricción
};

function updatePlayerMovement(
  player: Player,
  input: InputState,
  dt: number
): void {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  if (direction !== 0) {
    // Acelerando
    player.velocity.vx += direction * PLAYER_CONFIG.acceleration * dt;
    player.velocity.vx = clamp(
      player.velocity.vx,
      -PLAYER_CONFIG.maxSpeed,
      PLAYER_CONFIG.maxSpeed
    );
  } else {
    // Desacelerando (fricción)
    const friction = PLAYER_CONFIG.deceleration * dt;
    if (Math.abs(player.velocity.vx) < friction) {
      player.velocity.vx = 0;
    } else {
      player.velocity.vx -= Math.sign(player.velocity.vx) * friction;
    }
  }

  // Actualizar posición
  player.x += player.velocity.vx * dt;

  // Límites del canvas
  player.x = clamp(player.x, 0, CANVAS_WIDTH - player.width);
}
```

### 5.2 Falling Objects Movement

```typescript
function updateFallingObjects(
  objects: FallingObject[],
  difficulty: DifficultyState,
  dt: number,
  canvasHeight: number
): void {
  for (const obj of objects) {
    if (!obj.active) continue;

    // Movimiento con delta time
    obj.y += difficulty.fallSpeed * dt;

    // Marcar como "saveable" cerca del suelo
    const SAVE_ZONE = 50;
    if (obj.y > canvasHeight - SAVE_ZONE && !obj.isSaveable) {
      obj.isSaveable = true;
    }
  }
}
```

---

## 6. Sistema de Puntuación y Combos

### 6.1 Configuración de Puntos

```typescript
const SCORE_CONFIG = {
  goodItem: {
    base: 10,
    perfectBonus: 1.5,     // Catch en zona perfecta
    saveBonus: 2.0,        // Catch cerca del suelo
  },
  badItem: {
    penalty: -5,
  },
  combo: {
    window: 2000,          // ms para mantener combo
    thresholds: [
      { count: 5, multiplier: 1.5 },
      { count: 10, multiplier: 2.0 },
      { count: 20, multiplier: 3.0 },
      { count: 50, multiplier: 5.0 },
    ],
  },
};
```

### 6.2 Sistema de Combo

```typescript
class ComboSystem {
  private state: ComboState = {
    count: 0,
    multiplier: 1,
    timer: 0,
    maxTimer: SCORE_CONFIG.combo.window,
  };

  hit(isPerfect: boolean, isSave: boolean): number {
    this.state.count++;
    this.state.timer = this.state.maxTimer;

    // Actualizar multiplier si alcanzamos threshold
    for (const threshold of SCORE_CONFIG.combo.thresholds) {
      if (this.state.count === threshold.count) {
        this.state.multiplier = threshold.multiplier;
        // Trigger combo milestone feedback
        break;
      }
    }

    // Calcular score
    let points = SCORE_CONFIG.goodItem.base;
    if (isPerfect) points *= SCORE_CONFIG.goodItem.perfectBonus;
    if (isSave) points *= SCORE_CONFIG.goodItem.saveBonus;

    return Math.floor(points * this.state.multiplier);
  }

  miss(): void {
    this.state.count = 0;
    this.state.multiplier = 1;
  }

  update(dt: number): void {
    if (this.state.timer > 0) {
      this.state.timer -= dt * 1000;
      if (this.state.timer <= 0) {
        this.miss();
      }
    }
  }

  get comboCount(): number { return this.state.count; }
  get multiplier(): number { return this.state.multiplier; }
  get timerPercent(): number {
    return this.state.timer / this.state.maxTimer;
  }
}
```

---

## 7. Sistema de Vidas

### 7.1 Configuración

```typescript
const LIVES_CONFIG = {
  initial: 3,
  max: 5,
  invulnerabilityDuration: 1500, // ms después de perder vida
  flashInterval: 100,            // ms para efecto de parpadeo
};
```

### 7.2 Lógica de Vidas

```typescript
function handleMissedGoodItem(state: GameState): GameState {
  // Solo objetos buenos que llegan al suelo quitan vidas
  // Objetos malos que llegan al suelo NO quitan vidas

  const newLives = state.lives - 1;

  return {
    ...state,
    lives: newLives,
    player: {
      ...state.player,
      isInvulnerable: true,
      invulnerabilityTimer: LIVES_CONFIG.invulnerabilityDuration,
    },
    status: newLives <= 0 ? 'gameOver' : state.status,
  };
}

function handleCatchBadItem(state: GameState): GameState {
  // Atrapar objeto malo resta puntos pero NO quita vidas
  const newScore = Math.max(0, state.score + SCORE_CONFIG.badItem.penalty);

  return {
    ...state,
    score: newScore,
  };
}
```

---

## 8. Sistema de Dificultad

### 8.1 Curva de Dificultad (Logarítmica)

```typescript
const DIFFICULTY_CONFIG = {
  initial: {
    spawnInterval: 1500,    // ms entre spawns
    fallSpeed: 150,         // pixels/segundo
    badItemRatio: 0.2,      // 20% malos
  },
  max: {
    spawnInterval: 400,
    fallSpeed: 400,
    badItemRatio: 0.45,
  },
  // Factores de escalado
  scorePerLevel: 500,       // Score para subir nivel
  maxLevel: 20,
};

function calculateDifficulty(score: number): DifficultyState {
  const level = Math.min(
    Math.floor(score / DIFFICULTY_CONFIG.scorePerLevel),
    DIFFICULTY_CONFIG.maxLevel
  );

  // Curva logarítmica para transición suave
  const t = level / DIFFICULTY_CONFIG.maxLevel;
  const easedT = Math.log(1 + t * (Math.E - 1)); // Logarithmic easing

  const lerp = (min: number, max: number) => min + (max - min) * easedT;

  return {
    level,
    spawnInterval: lerp(
      DIFFICULTY_CONFIG.initial.spawnInterval,
      DIFFICULTY_CONFIG.max.spawnInterval
    ),
    fallSpeed: lerp(
      DIFFICULTY_CONFIG.initial.fallSpeed,
      DIFFICULTY_CONFIG.max.fallSpeed
    ),
    badItemRatio: lerp(
      DIFFICULTY_CONFIG.initial.badItemRatio,
      DIFFICULTY_CONFIG.max.badItemRatio
    ),
  };
}
```

---

## 9. Sistema de Spawn

### 9.1 Spawn con Fairness

```typescript
const SPAWN_CONFIG = {
  maxItemsOnScreen: 8,
  minHorizontalGap: 60,         // pixels entre items
  lanes: 6,                      // dividir pantalla en lanes
  recentLaneMemory: 2,          // evitar repetir lanes
  guaranteedGoodEvery: 4,       // garantizar 1 good cada N spawns
  gracePeriodStart: 3000,       // ms sin bad items al inicio
};

class SpawnSystem {
  private recentLanes: number[] = [];
  private spawnsSinceGood = 0;
  private elapsedTime = 0;

  spawn(
    difficulty: DifficultyState,
    activeObjects: FallingObject[],
    canvasWidth: number
  ): FallingObject | null {
    // No exceder máximo
    if (activeObjects.length >= SPAWN_CONFIG.maxItemsOnScreen) {
      return null;
    }

    // Seleccionar lane disponible
    const laneWidth = canvasWidth / SPAWN_CONFIG.lanes;
    const availableLanes = Array.from(
      { length: SPAWN_CONFIG.lanes },
      (_, i) => i
    ).filter(lane => !this.recentLanes.includes(lane));

    if (availableLanes.length === 0) {
      this.recentLanes = [];
      return null;
    }

    // Preferir lanes centrales (weighted random)
    const centerLane = SPAWN_CONFIG.lanes / 2;
    const weights = availableLanes.map(lane =>
      1 - Math.abs(lane - centerLane) / SPAWN_CONFIG.lanes * 0.5
    );
    const selectedLane = weightedRandom(availableLanes, weights);

    // Actualizar memoria de lanes
    this.recentLanes.push(selectedLane);
    if (this.recentLanes.length > SPAWN_CONFIG.recentLaneMemory) {
      this.recentLanes.shift();
    }

    // Determinar tipo (good/bad)
    let type: 'good' | 'bad';

    // Grace period: no bad items al inicio
    if (this.elapsedTime < SPAWN_CONFIG.gracePeriodStart) {
      type = 'good';
    }
    // Garantizar good items periódicamente
    else if (this.spawnsSinceGood >= SPAWN_CONFIG.guaranteedGoodEvery) {
      type = 'good';
    }
    // Random basado en difficulty
    else {
      type = Math.random() < difficulty.badItemRatio ? 'bad' : 'good';
    }

    // Actualizar contador
    if (type === 'good') {
      this.spawnsSinceGood = 0;
    } else {
      this.spawnsSinceGood++;
    }

    // Crear objeto
    return {
      id: generateId(),
      x: selectedLane * laneWidth + laneWidth / 2,
      y: -50,
      width: 40,
      height: 40,
      velocity: { vx: 0, vy: difficulty.fallSpeed },
      type,
      points: type === 'good' ? 10 : -5,
      spriteIndex: Math.floor(Math.random() * 4),
      active: true,
      isSaveable: false,
      reset() {
        this.active = false;
        this.isSaveable = false;
      },
    };
  }

  update(dt: number): void {
    this.elapsedTime += dt * 1000;
  }
}
```

---

## 10. Sistema de Audio

### 10.1 Configuración de Sonidos

```typescript
// audio/sounds.config.ts
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

  // Música
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
```

### 10.2 Sound Manager (Howler.js)

```typescript
import { Howl, Howler } from 'howler';

class SoundManager {
  private sounds = new Map<string, Howl>();
  private currentMusic: Howl | null = null;

  async preload(soundConfig: typeof SOUNDS): Promise<void> {
    const promises = Object.entries(soundConfig).map(([name, config]) => {
      return new Promise<void>((resolve, reject) => {
        const howl = new Howl({
          src: config.src,
          volume: config.volume ?? 1,
          loop: config.loop ?? false,
          pool: config.pool ?? 5,
          onload: () => resolve(),
          onloaderror: (_, error) => reject(error),
        });
        this.sounds.set(name, howl);
      });
    });
    await Promise.all(promises);
  }

  play(name: string, options?: { rate?: number }): void {
    const sound = this.sounds.get(name);
    if (sound) {
      const id = sound.play();
      if (options?.rate) {
        sound.rate(options.rate, id);
      }
    }
  }

  // Variación de pitch para evitar fatiga auditiva
  playVaried(name: string, variation = 0.1): void {
    const rate = 1 + (Math.random() - 0.5) * 2 * variation;
    this.play(name, { rate });
  }

  playMusic(name: string, fadeTime = 1000): void {
    if (this.currentMusic) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, fadeTime);
      setTimeout(() => this.currentMusic?.stop(), fadeTime);
    }

    const music = this.sounds.get(name);
    if (music) {
      music.volume(0);
      music.play();
      music.fade(0, SOUNDS[name].volume, fadeTime);
      this.currentMusic = music;
    }
  }
}

export const soundManager = new SoundManager();
```

---

## 11. Feedback Visual (Game Feel)

### 11.1 Screen Shake

```typescript
class ScreenShake {
  private intensity = 0;
  private decay = 0.9;

  shake(amount: number): void {
    this.intensity = Math.min(this.intensity + amount, 20);
  }

  update(): { x: number; y: number } {
    if (this.intensity < 0.1) {
      this.intensity = 0;
      return { x: 0, y: 0 };
    }

    const offset = {
      x: (Math.random() - 0.5) * this.intensity,
      y: (Math.random() - 0.5) * this.intensity,
    };

    this.intensity *= this.decay;
    return offset;
  }
}
```

### 11.2 Floating Score Text

```typescript
interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  scale: number;
  color: string;
}

class FloatingTextManager {
  private texts: FloatingText[] = [];

  spawn(text: string, x: number, y: number, color = '#FFD700'): void {
    this.texts.push({
      text,
      x,
      y,
      vy: -3,
      alpha: 1,
      scale: 1.5,
      color,
    });
  }

  update(dt: number): void {
    this.texts = this.texts.filter(t => {
      t.y += t.vy;
      t.vy *= 0.95;
      t.alpha -= 0.02;
      t.scale = Math.max(1, t.scale * 0.95);
      return t.alpha > 0;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const t of this.texts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${20 * t.scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}
```

### 11.3 Flash Effects

```typescript
// Flash de pantalla sutil para catches
const FLASH_CONFIG = {
  goodCatch: { color: '#00FF00', intensity: 0.1 },
  badCatch: { color: '#FF0000', intensity: 0.15 },
  loseLife: { color: '#FF0000', intensity: 0.3 },
  combo: { color: '#FFD700', intensity: 0.2 },
};
```

---

## 12. Responsive Design

### 12.1 Canvas Scaling

```typescript
const GAME_ASPECT_RATIO = 9 / 16; // Portrait
const BASE_WIDTH = 400;
const BASE_HEIGHT = 711;

function resizeCanvas(canvas: HTMLCanvasElement): void {
  const windowRatio = window.innerWidth / window.innerHeight;

  let width: number;
  let height: number;

  if (windowRatio > GAME_ASPECT_RATIO) {
    // Pantalla más ancha - pillarbox
    height = window.innerHeight;
    width = height * GAME_ASPECT_RATIO;
  } else {
    // Pantalla más alta - letterbox
    width = window.innerWidth;
    height = width / GAME_ASPECT_RATIO;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Centrar
  canvas.style.position = 'absolute';
  canvas.style.left = `${(window.innerWidth - width) / 2}px`;
  canvas.style.top = `${(window.innerHeight - height) / 2}px`;
}
```

### 12.2 Safe Areas (Notch/Home Indicator)

```css
.game-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.hud-score {
  top: max(16px, env(safe-area-inset-top));
}

.hud-lives {
  top: max(16px, env(safe-area-inset-top));
}
```

---

## 13. Persistencia y High Scores

### 13.1 Local Storage

```typescript
interface SaveData {
  highScore: number;
  totalGamesPlayed: number;
  totalScore: number;
  achievements: string[];
  settings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    reducedMotion: boolean;
  };
}

const STORAGE_KEY = 'catch_game_save';

function saveGame(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadGame(): SaveData | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}
```

---

## 14. Accesibilidad

### 14.1 Configuración

```typescript
const ACCESSIBILITY_CONFIG = {
  // Tamaños mínimos
  minFontSize: 18,
  minTouchTarget: 48,

  // Contraste
  minContrastRatio: 4.5,

  // Reducción de movimiento
  reducedMotion: {
    disableScreenShake: true,
    disableParticles: true,
    simplifyAnimations: true,
  },

  // Daltonismo
  colorSchemes: {
    default: {
      good: '#22c55e',
      bad: '#ef4444',
    },
    deuteranopia: {
      good: '#3b82f6',
      bad: '#f97316',
    },
    protanopia: {
      good: '#06b6d4',
      bad: '#eab308',
    },
  },
};
```

### 14.2 Hook para Preferencias del Sistema

```typescript
function useAccessibilityPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { prefersReducedMotion };
}
```

---

## 15. Assets Requeridos

### 15.1 Imágenes

| Asset | Ubicación | Dimensiones | Formato |
|-------|-----------|-------------|---------|
| Player | `assets/player.png` | 64x64 - 128x128 | PNG transparente |
| Good 1-4 | `assets/good_1.png` ... `good_4.png` | 40x40 - 64x64 | PNG transparente |
| Bad 1-4 | `assets/bad_1.png` ... `bad_4.png` | 40x40 - 64x64 | PNG transparente |
| Heart (vida) | `assets/heart.png` | 24x24 - 32x32 | PNG transparente |
| Background (opcional) | `assets/background.png` | 1080x1920 | PNG/JPG |

### 15.2 Sonidos

| Sonido | Archivo | Duración | Uso |
|--------|---------|----------|-----|
| Catch bueno | `catch.mp3/.webm` | 50-150ms | Cada good catch |
| Catch malo | `bad-catch.mp3/.webm` | 100-200ms | Cada bad catch |
| Perder vida | `lose-life.mp3/.webm` | 200-400ms | Al perder vida |
| Combo 5/10/20 | `combo-*.mp3/.webm` | 200-400ms | Milestones |
| Game Over | `game-over.mp3/.webm` | 1-2s | Al perder |
| High Score | `high-score.mp3/.webm` | 1-2s | Nuevo récord |
| Música menú | `menu-music.mp3/.webm` | Loop | En menú |
| Música juego | `game-music.mp3/.webm` | Loop | Durante juego |

---

## 16. Performance Targets

| Métrica | Target |
|---------|--------|
| Frame Rate | 60 FPS estable |
| Input Latency | < 50ms |
| Time to Interactive | < 3s |
| Memory Usage | < 100MB |
| Bundle Size | < 500KB gzipped |
| First Contentful Paint | < 1.5s |

---

## 17. Test Cases

| ID | Caso | Resultado Esperado |
|----|------|-------------------|
| TC-01 | Iniciar nuevo juego | Score=0, Lives=3, Status=playing |
| TC-02 | Mover con flechas | Movimiento suave horizontal |
| TC-03 | Mover con touch | Movimiento continuo mientras se toca |
| TC-04 | Atrapar good item | Score aumenta, sonido positivo |
| TC-05 | Atrapar bad item | Score disminuye, sonido negativo |
| TC-06 | Good item cae al piso | Pierde 1 vida |
| TC-07 | Bad item cae al piso | Sin penalización |
| TC-08 | Vidas llegan a 0 | Game Over screen |
| TC-09 | Combo de 5+ | Multiplier activo, feedback |
| TC-10 | Pausar con Escape | Juego se pausa |
| TC-11 | Resize de ventana | Canvas se escala correctamente |
| TC-12 | High score | Se guarda en localStorage |

---

## 18. Fases de Implementación

### Fase 1: Core Setup (Prioridad 1-5)
- Proyecto React + TypeScript + Vite
- Interfaces TypeScript
- Canvas básico con resize
- Game loop con fixed timestep
- Configuración de assets

### Fase 2: Gameplay Core (Prioridad 6-13)
- Player rendering y movimiento
- Input system (keyboard)
- Spawn system
- Falling objects
- Collision detection
- Score system
- Lives system
- Combo system

### Fase 3: Controles (Prioridad 14-15)
- Touch controls
- Device detection

### Fase 4: UI/UX (Prioridad 16-19)
- Main menu
- HUD
- Game over screen
- Pause menu

### Fase 5: Polish (Prioridad 20-26)
- Audio (Howler.js)
- Sound effects integration
- Difficulty progression
- Responsive design
- Visual assets
- High scores
- Final testing

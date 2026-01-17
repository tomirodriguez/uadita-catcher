// SoundManager.ts - Retro sound effects using Web Audio API

const STORAGE_KEY = 'catchGame_audioSettings'

interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  muted: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 1,
  musicVolume: 1,
  sfxVolume: 1,
  muted: false,
}

type SoundName =
  | 'catch'
  | 'badCatch'
  | 'miss'
  | 'loseLife'
  | 'combo5'
  | 'combo10'
  | 'combo20'
  | 'click'
  | 'gameOver'
  | 'highScore'

class SoundManager {
  private static instance: SoundManager | null = null
  private settings: AudioSettings = { ...DEFAULT_SETTINGS }
  private audioContext: AudioContext | null = null

  private constructor() {
    this.loadSettings()
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (this.isValidSettings(parsed)) {
          this.settings = parsed
        }
      }
    } catch {
      // Use default settings
    }
  }

  private isValidSettings(value: unknown): value is AudioSettings {
    if (typeof value !== 'object' || value === null) return false
    const obj = value as Record<string, unknown>
    return (
      typeof obj.masterVolume === 'number' &&
      typeof obj.sfxVolume === 'number' &&
      typeof obj.muted === 'boolean'
    )
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
    } catch {
      // Silently fail
    }
  }

  async preload(): Promise<void> {
    // Web Audio API doesn't need preloading
    return Promise.resolve()
  }

  /**
   * Play a retro sound effect using Web Audio API
   */
  play(name: string): number | undefined {
    if (this.settings.muted) return undefined

    const volume = this.settings.sfxVolume * this.settings.masterVolume

    switch (name as SoundName) {
      case 'catch':
        this.playCoinSound(volume * 0.4)
        break
      case 'badCatch':
        this.playHurtSound(volume * 0.5)
        break
      case 'miss':
        this.playMissSound(volume * 0.3)
        break
      case 'loseLife':
        this.playExplosionSound(volume * 0.5)
        break
      case 'combo5':
        this.playPowerUpSound(volume * 0.5, 1.0)
        break
      case 'combo10':
        this.playPowerUpSound(volume * 0.6, 1.2)
        break
      case 'combo20':
        this.playPowerUpSound(volume * 0.7, 1.4)
        break
      case 'click':
        this.playClickSound(volume * 0.3)
        break
      case 'gameOver':
        this.playGameOverSound(volume * 0.6)
        break
      case 'highScore':
        this.playHighScoreSound(volume * 0.7)
        break
      default:
        return undefined
    }

    return 1
  }

  private playCoinSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(987, now) // B5
    osc.frequency.setValueAtTime(1319, now + 0.05) // E6

    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  private playHurtSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2)

    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  private playMissSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)

    gain.gain.setValueAtTime(volume * 0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  private playExplosionSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    // Create noise using buffer
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    noise.buffer = buffer
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, now)
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.3)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    noise.start(now)
    noise.stop(now + 0.3)
  }

  private playPowerUpSound(volume: number, pitchMultiplier: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    const baseFreq = 440 * pitchMultiplier
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.1)
    osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.2)

    gain.gain.setValueAtTime(volume, now)
    gain.gain.setValueAtTime(volume, now + 0.25)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    osc.start(now)
    osc.stop(now + 0.4)
  }

  private playClickSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(800, now)

    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  private playGameOverSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    // Descending notes
    const frequencies = [392, 349, 330, 294] // G4, F4, E4, D4

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + i * 0.15)

      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(volume, now + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.14)

      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.15)
    })
  }

  private playHighScoreSound(volume: number): void {
    const ctx = this.getAudioContext()
    const now = ctx.currentTime

    // Ascending fanfare
    const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + i * 0.12)

      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(volume, now + i * 0.12)
      gain.gain.setValueAtTime(volume, now + i * 0.12 + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.2)

      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.25)
    })
  }

  playVaried(name: string, _pitchVariation = 0.1): number | undefined {
    return this.play(name)
  }

  playMusic(_name: string, _fadeTime = 1000): void {
    // No music support in retro mode
  }

  stopMusic(_fadeTime = 1000): void {
    // No-op
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted
    this.saveSettings()
    return this.settings.muted
  }

  isMuted(): boolean {
    return this.settings.muted
  }

  getMasterVolume(): number {
    return this.settings.masterVolume
  }

  getMusicVolume(): number {
    return this.settings.musicVolume
  }

  getSfxVolume(): number {
    return this.settings.sfxVolume
  }

  getSettings(): AudioSettings {
    return { ...this.settings }
  }
}

export const soundManager = SoundManager.getInstance()
export { SoundManager }

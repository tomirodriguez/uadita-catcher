import { Howl, Howler } from 'howler';
import { SOUNDS, type SoundConfig } from './sounds.config';

const STORAGE_KEY = 'catchGame_audioSettings';

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 1,
  musicVolume: 1,
  sfxVolume: 1,
  muted: false,
};

class SoundManager {
  private static instance: SoundManager | null = null;

  private sounds = new Map<string, Howl>();
  private currentMusic: Howl | null = null;
  private currentMusicName: string | null = null;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private wasPlayingBeforeHidden = false;

  private constructor() {
    this.loadSettings();
    this.setupVisibilityHandler();
    this.applyMasterVolume();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (this.isValidSettings(parsed)) {
          this.settings = parsed;
        }
      }
    } catch {
      // Use default settings if localStorage fails
    }
  }

  private isValidSettings(value: unknown): value is AudioSettings {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.masterVolume === 'number' &&
      typeof obj.musicVolume === 'number' &&
      typeof obj.sfxVolume === 'number' &&
      typeof obj.muted === 'boolean'
    );
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.wasPlayingBeforeHidden =
          this.currentMusic !== null && this.currentMusic.playing();
        if (this.currentMusic?.playing()) {
          this.currentMusic.pause();
        }
      } else {
        if (this.wasPlayingBeforeHidden && this.currentMusic && !this.settings.muted) {
          this.currentMusic.play();
        }
      }
    });
  }

  private applyMasterVolume(): void {
    const effectiveVolume = this.settings.muted ? 0 : this.settings.masterVolume;
    Howler.volume(effectiveVolume);
  }

  async preload(
    soundConfig: Record<string, SoundConfig> = SOUNDS
  ): Promise<void> {
    const promises = Object.entries(soundConfig).map(([name, config]) => {
      return new Promise<void>((resolve, reject) => {
        const howl = new Howl({
          src: config.src,
          volume: config.volume,
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

  play(name: string, options?: { rate?: number }): number | undefined {
    if (this.settings.muted) return undefined;

    const sound = this.sounds.get(name);
    if (!sound) return undefined;

    const effectiveVolume = this.getEffectiveSfxVolume(name);
    sound.volume(effectiveVolume);

    const id = sound.play();
    if (options?.rate) {
      sound.rate(options.rate, id);
    }
    return id;
  }

  playVaried(name: string, pitchVariation = 0.1): number | undefined {
    const rate = 1 + (Math.random() - 0.5) * 2 * pitchVariation;
    return this.play(name, { rate });
  }

  playMusic(name: string, fadeTime = 1000): void {
    if (this.currentMusicName === name && this.currentMusic?.playing()) {
      return;
    }

    if (this.currentMusic) {
      const oldMusic = this.currentMusic;
      oldMusic.fade(oldMusic.volume(), 0, fadeTime);
      setTimeout(() => oldMusic.stop(), fadeTime);
    }

    const music = this.sounds.get(name);
    if (!music) return;

    const config = SOUNDS[name];
    const targetVolume = this.getEffectiveMusicVolume(config?.volume ?? 0.5);

    music.volume(0);
    music.play();

    if (!this.settings.muted) {
      music.fade(0, targetVolume, fadeTime);
    }

    this.currentMusic = music;
    this.currentMusicName = name;
  }

  stopMusic(fadeTime = 1000): void {
    if (this.currentMusic) {
      const oldMusic = this.currentMusic;
      oldMusic.fade(oldMusic.volume(), 0, fadeTime);
      setTimeout(() => {
        oldMusic.stop();
      }, fadeTime);
      this.currentMusic = null;
      this.currentMusicName = null;
    }
  }

  private getEffectiveSfxVolume(name: string): number {
    const config = SOUNDS[name];
    const baseVolume = config?.volume ?? 1;
    return baseVolume * this.settings.sfxVolume * this.settings.masterVolume;
  }

  private getEffectiveMusicVolume(baseVolume: number): number {
    return baseVolume * this.settings.musicVolume * this.settings.masterVolume;
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyMasterVolume();
    this.updateCurrentMusicVolume();
    this.saveSettings();
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateCurrentMusicVolume();
    this.saveSettings();
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  private updateCurrentMusicVolume(): void {
    if (this.currentMusic && this.currentMusicName) {
      const config = SOUNDS[this.currentMusicName];
      const targetVolume = this.getEffectiveMusicVolume(config?.volume ?? 0.5);
      this.currentMusic.volume(this.settings.muted ? 0 : targetVolume);
    }
  }

  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    this.applyMasterVolume();
    this.updateCurrentMusicVolume();
    this.saveSettings();
    return this.settings.muted;
  }

  isMuted(): boolean {
    return this.settings.muted;
  }

  getMasterVolume(): number {
    return this.settings.masterVolume;
  }

  getMusicVolume(): number {
    return this.settings.musicVolume;
  }

  getSfxVolume(): number {
    return this.settings.sfxVolume;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }
}

export const soundManager = SoundManager.getInstance();
export { SoundManager };

const STORAGE_KEY = 'catch_game_save';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
}

export interface SaveData {
  highScore: number;
  totalGamesPlayed: number;
  totalScore: number;
  achievements: string[];
  settings: GameSettings;
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 1,
  musicVolume: 1,
  sfxVolume: 1,
  reducedMotion: false,
};

const DEFAULT_SAVE_DATA: SaveData = {
  highScore: 0,
  totalGamesPlayed: 0,
  totalScore: 0,
  achievements: [],
  settings: DEFAULT_SETTINGS,
};

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isValidGameSettings(value: unknown): value is GameSettings {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.masterVolume === 'number' &&
    typeof obj.musicVolume === 'number' &&
    typeof obj.sfxVolume === 'number' &&
    typeof obj.reducedMotion === 'boolean'
  );
}

function isValidSaveData(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.highScore === 'number' &&
    typeof obj.totalGamesPlayed === 'number' &&
    typeof obj.totalScore === 'number' &&
    Array.isArray(obj.achievements) &&
    obj.achievements.every((a) => typeof a === 'string') &&
    isValidGameSettings(obj.settings)
  );
}

export function saveGame(data: SaveData): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): SaveData | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed: unknown = JSON.parse(saved);
    if (!isValidSaveData(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getOrCreateSaveData(): SaveData {
  const loaded = loadGame();
  if (loaded) return loaded;
  return { ...DEFAULT_SAVE_DATA, settings: { ...DEFAULT_SETTINGS } };
}

export function updateHighScore(newScore: number): boolean {
  const data = getOrCreateSaveData();
  if (newScore > data.highScore) {
    data.highScore = newScore;
    return saveGame(data);
  }
  return false;
}

export function recordGamePlayed(finalScore: number): boolean {
  const data = getOrCreateSaveData();
  data.totalGamesPlayed += 1;
  data.totalScore += finalScore;
  if (finalScore > data.highScore) {
    data.highScore = finalScore;
  }
  return saveGame(data);
}

export function updateSettings(settings: Partial<GameSettings>): boolean {
  const data = getOrCreateSaveData();
  data.settings = { ...data.settings, ...settings };
  return saveGame(data);
}

export function getSettings(): GameSettings {
  const data = getOrCreateSaveData();
  return data.settings;
}

export function getHighScore(): number {
  const data = loadGame();
  return data?.highScore ?? 0;
}

export function clearSaveData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

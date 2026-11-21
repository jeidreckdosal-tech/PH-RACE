import { AccessoryId, LeaderboardEntry, MapId, PlayerProgress } from '../types/game';

const STORAGE_KEY = 'bambang_race_progress_v1';

export const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 250,
  totalRaces: 0,
  totalWins: 0,
  selectedCharacter: 'bobonoy',
  selectedVehicle: 'moriones-gt',
  selectedColor: '#ef4444',
  selectedLivery: 'stripes',
  selectedAccessory: 'none',
  selectedMap: 'tondo',
  selectedMode: 'quick',
  unlockedVehicles: ['moriones-gt', 'tondo-sb600', 'bambang-kart'],
  unlockedColors: ['#ef4444', '#06b6d4', '#f59e0b', '#2563eb'],
  unlockedAccessories: ['none'],
  bestTimesMs: {},
  leaderboard: [
    {
      id: 'seed-1',
      mapId: 'tondo',
      characterId: 'bobonoy',
      vehicleId: 'moriones-gt',
      timeMs: 82450,
      mode: 'quick',
      dateIso: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 'seed-2',
      mapId: 'manila',
      characterId: 'msbengbeng',
      vehicleId: 'tondo-sb600',
      timeMs: 86120,
      mode: 'quick',
      dateIso: '2026-11-12T14:30:00.000Z',
    },
  ],
  audio: {
    masterVolume: 0.75,
    musicVolume: 0.45,
    sfxVolume: 0.85,
    muted: false,
  },
};

export function loadProgress(): PlayerProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_PROGRESS);
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      unlockedVehicles: parsed.unlockedVehicles?.length
        ? parsed.unlockedVehicles
        : DEFAULT_PROGRESS.unlockedVehicles,
      unlockedColors: parsed.unlockedColors?.length
        ? parsed.unlockedColors
        : DEFAULT_PROGRESS.unlockedColors,
      unlockedAccessories: (parsed.unlockedAccessories?.length
        ? parsed.unlockedAccessories
        : DEFAULT_PROGRESS.unlockedAccessories) as AccessoryId[],
      bestTimesMs: parsed.bestTimesMs ?? {},
      leaderboard: parsed.leaderboard ?? DEFAULT_PROGRESS.leaderboard,
      audio: {
        ...DEFAULT_PROGRESS.audio,
        ...(parsed.audio ?? {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetProgress(): PlayerProgress {
  const fresh = structuredClone(DEFAULT_PROGRESS);
  saveProgress(fresh);
  return fresh;
}

export function addLeaderboardRecord(
  current: PlayerProgress,
  entry: Omit<LeaderboardEntry, 'id' | 'dateIso'>
): { next: PlayerProgress; isNewBest: boolean } {
  const prevBest = current.bestTimesMs[entry.mapId];
  const isNewBest = prevBest === undefined || entry.timeMs < prevBest;
  const fullEntry: LeaderboardEntry = {
    ...entry,
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dateIso: new Date().toISOString(),
  };

  const nextLeaderboard = [...current.leaderboard, fullEntry]
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, 30);

  const nextBestTimes: Partial<Record<MapId, number>> = {
    ...current.bestTimesMs,
    [entry.mapId]: isNewBest ? entry.timeMs : prevBest,
  };

  const next: PlayerProgress = {
    ...current,
    bestTimesMs: nextBestTimes,
    leaderboard: nextLeaderboard,
  };
  saveProgress(next);
  return { next, isNewBest };
}

export function formatTimeMs(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const millis = Math.floor((clamped % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HIGH_SCORE_CLASSIC: 'highscore_classic',
  HIGH_SCORE_STROOP: 'highscore_stroop',
  BEST_LEVEL_CLASSIC: 'bestlevel_classic',
  BEST_LEVEL_STROOP: 'bestlevel_stroop',
  BEST_STREAK: 'best_streak',
  TOTAL_GAMES: 'total_games',
  ACHIEVEMENTS: 'achievements',
  SETTINGS: 'settings',
  DAILY_CHALLENGE: 'daily_challenge',
};

export interface GameSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  showTutorial: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  showTutorial: true,
};

export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'first_game', title: 'First Steps', description: 'Complete your first game' },
  { id: 'level_5', title: 'Getting Warmer', description: 'Reach level 5' },
  { id: 'level_10', title: 'Color Apprentice', description: 'Reach level 10' },
  { id: 'level_20', title: 'Color Master', description: 'Reach level 20' },
  { id: 'level_50', title: 'Color Legend', description: 'Reach level 50' },
  { id: 'streak_5', title: 'On a Roll', description: 'Get a 5-level streak' },
  { id: 'streak_10', title: 'Unstoppable', description: 'Get a 10-level streak' },
  { id: 'streak_20', title: 'Streak Machine', description: 'Get a 20-level streak' },
  { id: 'perfect_10', title: 'Perfect Ten', description: 'Complete 10 levels without losing a life' },
  { id: 'score_1000', title: 'Score Hunter', description: 'Score over 1,000 points' },
  { id: 'score_5000', title: 'Score Master', description: 'Score over 5,000 points' },
  { id: 'stroop_5', title: 'Mind Bender', description: 'Reach level 5 in Stroop Mode' },
  { id: 'stroop_10', title: 'Brain Twister', description: 'Reach level 10 in Stroop Mode' },
  { id: 'games_10', title: 'Dedicated', description: 'Play 10 games' },
  { id: 'games_50', title: 'Addicted', description: 'Play 50 games' },
  { id: 'games_100', title: 'True Fan', description: 'Play 100 games' },
];

async function getNumber(key: string): Promise<number> {
  const val = await AsyncStorage.getItem(key);
  return val ? parseInt(val, 10) : 0;
}

export async function getSettings(): Promise<GameSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getHighScore(mode: 'classic' | 'stroop'): Promise<number> {
  return getNumber(mode === 'classic' ? KEYS.HIGH_SCORE_CLASSIC : KEYS.HIGH_SCORE_STROOP);
}

export async function getBestLevel(mode: 'classic' | 'stroop'): Promise<number> {
  return getNumber(mode === 'classic' ? KEYS.BEST_LEVEL_CLASSIC : KEYS.BEST_LEVEL_STROOP);
}

export async function saveGameResult(
  mode: 'classic' | 'stroop',
  score: number,
  level: number,
  bestStreak: number
): Promise<Achievement[]> {
  const highScoreKey = mode === 'classic' ? KEYS.HIGH_SCORE_CLASSIC : KEYS.HIGH_SCORE_STROOP;
  const bestLevelKey = mode === 'classic' ? KEYS.BEST_LEVEL_CLASSIC : KEYS.BEST_LEVEL_STROOP;

  const currentHighScore = await getNumber(highScoreKey);
  const currentBestLevel = await getNumber(bestLevelKey);
  const currentBestStreak = await getNumber(KEYS.BEST_STREAK);
  const totalGames = await getNumber(KEYS.TOTAL_GAMES);

  if (score > currentHighScore) {
    await AsyncStorage.setItem(highScoreKey, score.toString());
  }
  if (level > currentBestLevel) {
    await AsyncStorage.setItem(bestLevelKey, level.toString());
  }
  if (bestStreak > currentBestStreak) {
    await AsyncStorage.setItem(KEYS.BEST_STREAK, bestStreak.toString());
  }
  await AsyncStorage.setItem(KEYS.TOTAL_GAMES, (totalGames + 1).toString());

  return checkAchievements(mode, score, level, bestStreak, totalGames + 1);
}

async function checkAchievements(
  mode: 'classic' | 'stroop',
  score: number,
  level: number,
  bestStreak: number,
  totalGames: number
): Promise<Achievement[]> {
  const raw = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
  const unlocked: Record<string, string> = raw ? JSON.parse(raw) : {};
  const newlyUnlocked: Achievement[] = [];

  const checks: [string, boolean][] = [
    ['first_game', true],
    ['level_5', level >= 5],
    ['level_10', level >= 10],
    ['level_20', level >= 20],
    ['level_50', level >= 50],
    ['streak_5', bestStreak >= 5],
    ['streak_10', bestStreak >= 10],
    ['streak_20', bestStreak >= 20],
    ['score_1000', score >= 1000],
    ['score_5000', score >= 5000],
    ['stroop_5', mode === 'stroop' && level >= 5],
    ['stroop_10', mode === 'stroop' && level >= 10],
    ['games_10', totalGames >= 10],
    ['games_50', totalGames >= 50],
    ['games_100', totalGames >= 100],
  ];

  const now = new Date().toISOString();
  for (const [id, condition] of checks) {
    if (condition && !unlocked[id]) {
      unlocked[id] = now;
      const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
      if (def) newlyUnlocked.push({ ...def, unlockedAt: now });
    }
  }

  await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));
  return newlyUnlocked;
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const raw = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
  const unlocked: Record<string, string> = raw ? JSON.parse(raw) : {};
  return ACHIEVEMENT_DEFS
    .filter(a => unlocked[a.id])
    .map(a => ({ ...a, unlockedAt: unlocked[a.id] }));
}

export async function getAllStats() {
  const [classicHigh, stroopHigh, classicLevel, stroopLevel, bestStreak, totalGames] =
    await Promise.all([
      getHighScore('classic'),
      getHighScore('stroop'),
      getBestLevel('classic'),
      getBestLevel('stroop'),
      getNumber(KEYS.BEST_STREAK),
      getNumber(KEYS.TOTAL_GAMES),
    ]);

  return { classicHigh, stroopHigh, classicLevel, stroopLevel, bestStreak, totalGames };
}

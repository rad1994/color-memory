import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME_ID } from '../constants/themes';

export type StoredMode = 'classic' | 'stroop' | 'daily';

const KEYS = {
  HIGH_SCORE: (mode: StoredMode) => `highscore_${mode}`,
  BEST_LEVEL: (mode: StoredMode) => `bestlevel_${mode}`,
  BEST_STREAK: 'best_streak',
  TOTAL_GAMES: 'total_games',
  ACHIEVEMENTS: 'achievements',
  SETTINGS: 'settings',
  DAILY_LAST_DATE: 'daily_last_date',
  DAILY_LAST_SCORE: 'daily_last_score',
  DAILY_STREAK: 'daily_streak',
  DAILY_BEST_STREAK: 'daily_best_streak',
};

export interface GameSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  showTutorial: boolean;
  themeId: string;
  /** Color ids the player picked themselves; empty means use the theme's set. */
  customPalette: string[];
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
  themeId: DEFAULT_THEME_ID,
  customPalette: [],
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
  { id: 'score_1000', title: 'Score Hunter', description: 'Score over 1,000 points' },
  { id: 'score_5000', title: 'Score Master', description: 'Score over 5,000 points' },
  { id: 'stroop_5', title: 'Mind Bender', description: 'Reach level 5 in Stroop Mode' },
  { id: 'stroop_10', title: 'Brain Twister', description: 'Reach level 10 in Stroop Mode' },
  { id: 'daily_first', title: 'Daily Habit', description: 'Play your first Daily Challenge' },
  { id: 'daily_streak_3', title: 'Three in a Row', description: 'Play the Daily 3 days running' },
  { id: 'daily_streak_7', title: 'Perfect Week', description: 'Play the Daily 7 days running' },
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

export async function getHighScore(mode: StoredMode): Promise<number> {
  return getNumber(KEYS.HIGH_SCORE(mode));
}

export async function getBestLevel(mode: StoredMode): Promise<number> {
  return getNumber(KEYS.BEST_LEVEL(mode));
}

/** Local calendar day, so the Daily rolls over at the player's midnight. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

/** Stable seed for a given day, so everyone gets the same Daily. */
export function seedForDate(dateKey: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface DailyStatus {
  dateKey: string;
  playedToday: boolean;
  lastScore: number;
  streak: number;
  bestStreak: number;
}

export async function getDailyStatus(): Promise<DailyStatus> {
  const [lastDate, lastScore, streak, bestStreak] = await Promise.all([
    AsyncStorage.getItem(KEYS.DAILY_LAST_DATE),
    getNumber(KEYS.DAILY_LAST_SCORE),
    getNumber(KEYS.DAILY_STREAK),
    getNumber(KEYS.DAILY_BEST_STREAK),
  ]);

  const today = todayKey();
  const playedToday = lastDate === today;
  return {
    dateKey: today,
    playedToday,
    lastScore: playedToday ? lastScore : 0,
    // A streak only survives if the last play was today or yesterday.
    streak: lastDate === today || lastDate === yesterdayKey() ? streak : 0,
    bestStreak,
  };
}

async function recordDaily(score: number): Promise<void> {
  const lastDate = await AsyncStorage.getItem(KEYS.DAILY_LAST_DATE);
  const today = todayKey();
  if (lastDate === today) return; // one attempt per day

  const previousStreak = await getNumber(KEYS.DAILY_STREAK);
  const streak = lastDate === yesterdayKey() ? previousStreak + 1 : 1;
  const bestStreak = Math.max(streak, await getNumber(KEYS.DAILY_BEST_STREAK));

  await Promise.all([
    AsyncStorage.setItem(KEYS.DAILY_LAST_DATE, today),
    AsyncStorage.setItem(KEYS.DAILY_LAST_SCORE, score.toString()),
    AsyncStorage.setItem(KEYS.DAILY_STREAK, streak.toString()),
    AsyncStorage.setItem(KEYS.DAILY_BEST_STREAK, bestStreak.toString()),
  ]);
}

export async function saveGameResult(
  mode: StoredMode,
  score: number,
  level: number,
  bestStreak: number
): Promise<Achievement[]> {
  const currentHighScore = await getNumber(KEYS.HIGH_SCORE(mode));
  const currentBestLevel = await getNumber(KEYS.BEST_LEVEL(mode));
  const currentBestStreak = await getNumber(KEYS.BEST_STREAK);
  const totalGames = await getNumber(KEYS.TOTAL_GAMES);

  if (score > currentHighScore) {
    await AsyncStorage.setItem(KEYS.HIGH_SCORE(mode), score.toString());
  }
  if (level > currentBestLevel) {
    await AsyncStorage.setItem(KEYS.BEST_LEVEL(mode), level.toString());
  }
  if (bestStreak > currentBestStreak) {
    await AsyncStorage.setItem(KEYS.BEST_STREAK, bestStreak.toString());
  }
  await AsyncStorage.setItem(KEYS.TOTAL_GAMES, (totalGames + 1).toString());

  if (mode === 'daily') await recordDaily(score);

  const daily = await getDailyStatus();
  return checkAchievements(mode, score, level, bestStreak, totalGames + 1, daily.streak);
}

async function checkAchievements(
  mode: StoredMode,
  score: number,
  level: number,
  bestStreak: number,
  totalGames: number,
  dailyStreak: number
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
    ['daily_first', mode === 'daily'],
    ['daily_streak_3', dailyStreak >= 3],
    ['daily_streak_7', dailyStreak >= 7],
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
  const [
    classicHigh, stroopHigh, dailyHigh,
    classicLevel, stroopLevel, dailyLevel,
    bestStreak, totalGames, daily,
  ] = await Promise.all([
    getHighScore('classic'),
    getHighScore('stroop'),
    getHighScore('daily'),
    getBestLevel('classic'),
    getBestLevel('stroop'),
    getBestLevel('daily'),
    getNumber(KEYS.BEST_STREAK),
    getNumber(KEYS.TOTAL_GAMES),
    getDailyStatus(),
  ]);

  return {
    classicHigh, stroopHigh, dailyHigh,
    classicLevel, stroopLevel, dailyLevel,
    bestStreak, totalGames,
    dailyStreak: daily.streak,
    dailyBestStreak: daily.bestStreak,
  };
}

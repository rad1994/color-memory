import { GAME_COLORS, GameColor } from '../constants/colors';
import { getLevelConfig, LevelConfig } from '../constants/levels';
import { STROOP_COLORS, StroopColor } from '../constants/stroop';

export type GameMode = 'classic' | 'stroop' | 'daily';

export type Rng = () => number;

// Small deterministic PRNG. The Daily Challenge must deal every player the same
// colors on a given day, which Math.random cannot promise.
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Each level draws from its own stream, so replaying a level after a mistake
// deals the same colors rather than silently rerolling the daily.
function rngFor(seed: number | null, level: number): Rng {
  return seed === null ? Math.random : mulberry32(seed + level * 7919);
}


export interface StroopItem {
  word: StroopColor; // the color name written out — always the wrong answer
  ink: StroopColor;  // the color it is drawn in — this is what must be remembered
}

export interface GameState {
  mode: GameMode;
  level: number;
  lives: number;
  score: number;
  streak: number;
  bestStreak: number;
  comboMultiplier: number;
  sequence: GameColor[];
  stroopSequence: StroopItem[];
  palette: GameColor[];
  levelConfig: LevelConfig;
  phase: 'ready' | 'showing' | 'input' | 'success' | 'fail' | 'gameover';
  inputIndex: number;
  wheelRotation: number;
  hintsRemaining: number;
  /** Null means ordinary random play; a number pins the run to fixed content. */
  seed: number | null;
  /** The colors this run draws from, widened level by level up to paletteSize. */
  pool: GameColor[];
}

// Free hints per run for now; the plan is to buy these with collected coins,
// so the count lives in game state rather than being hardcoded in the UI.
export const HINTS_PER_GAME = 3;

function expectedColorAt(state: GameState, index: number): GameColor | null {
  return state.mode === 'stroop'
    ? state.stroopSequence[index]?.ink ?? null
    : state.sequence[index] ?? null;
}

// The color the player is expected to answer next, or null outside the input phase.
export function expectedColor(state: GameState): GameColor | null {
  if (state.phase !== 'input') return null;
  return expectedColorAt(state, state.inputIndex);
}

export function applyHint(state: GameState): { state: GameState; revealed: GameColor | null } {
  const revealed = expectedColor(state);
  if (!revealed || state.hintsRemaining <= 0) return { state, revealed: null };
  return { state: { ...state, hintsRemaining: state.hintsRemaining - 1 }, revealed };
}

function shuffled<T>(items: T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Stroop mode always plays on the fixed four-color direction pad, so the
// palette never grows with the level the way it does in classic mode — and its
// order must never move, since the whole mode rests on a stable color-to-
// direction mapping.
function paletteFor(
  mode: GameMode,
  levelConfig: LevelConfig,
  rng: Rng,
  pool: GameColor[]
): GameColor[] {
  if (mode === 'stroop') return STROOP_COLORS;
  // A player who picked fewer colors than the level calls for simply plays with
  // what they chose.
  const palette = pool.slice(0, Math.min(levelConfig.paletteSize, pool.length));
  // Board order drives tile position, so shuffling it forces the player to
  // recall the color itself instead of where it sat last level.
  return levelConfig.shuffleBoard ? shuffled(palette, rng) : palette;
}

export interface RunOptions {
  seed?: number | null;
  /** Colors to draw from; defaults to the standard eight. */
  pool?: GameColor[];
}

export function createInitialState(mode: GameMode, options: RunOptions = {}): GameState {
  const seed = options.seed ?? null;
  const pool = options.pool?.length ? options.pool : GAME_COLORS;
  const levelConfig = getLevelConfig(1);
  const rng = rngFor(seed, 1);
  const palette = paletteFor(mode, levelConfig, rng, pool);

  return {
    mode,
    level: 1,
    lives: 3,
    score: 0,
    streak: 0,
    bestStreak: 0,
    comboMultiplier: 1,
    sequence: generateSequence(palette, levelConfig.sequenceLength, rng),
    stroopSequence: mode === 'stroop'
      ? generateStroopSequence(levelConfig.sequenceLength, rng)
      : [],
    palette,
    levelConfig,
    phase: 'ready',
    inputIndex: 0,
    wheelRotation: 0,
    hintsRemaining: HINTS_PER_GAME,
    seed,
    pool,
  };
}

export function generateSequence(palette: GameColor[], length: number, rng: Rng = Math.random): GameColor[] {
  const seq: GameColor[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(palette[Math.floor(rng() * palette.length)]);
  }
  return seq;
}

export function generateStroopSequence(length: number, rng: Rng = Math.random): StroopItem[] {
  const items: StroopItem[] = [];
  for (let i = 0; i < length; i++) {
    const ink = STROOP_COLORS[Math.floor(rng() * STROOP_COLORS.length)];
    // The written word never matches the ink, and is always another color on the
    // pad — so reading it points at a real, wrong swipe direction. That response
    // conflict is what makes the interference bite.
    const conflicting = STROOP_COLORS.filter(c => c.id !== ink.id);
    const word = conflicting[Math.floor(rng() * conflicting.length)];
    items.push({ word, ink });
  }
  return items;
}

export function advanceLevel(state: GameState): GameState {
  const nextLevel = state.level + 1;
  const levelConfig = getLevelConfig(nextLevel);
  const rng = rngFor(state.seed, nextLevel);
  const palette = paletteFor(state.mode, levelConfig, rng, state.pool);
  const sequence = generateSequence(palette, levelConfig.sequenceLength, rng);
  const newStreak = state.streak + 1;
  const bestStreak = Math.max(state.bestStreak, newStreak);

  let comboMultiplier = 1;
  if (newStreak >= 10) comboMultiplier = 3;
  else if (newStreak >= 5) comboMultiplier = 2;
  else if (newStreak >= 3) comboMultiplier = 1.5;

  return {
    ...state,
    level: nextLevel,
    levelConfig,
    palette,
    sequence,
    stroopSequence: state.mode === 'stroop'
      ? generateStroopSequence(levelConfig.sequenceLength, rng)
      : [],
    phase: 'ready',
    inputIndex: 0,
    streak: newStreak,
    bestStreak,
    comboMultiplier,
    wheelRotation: state.wheelRotation + 45 + Math.random() * 90,
  };
}

export function handleInput(state: GameState, selectedColor: GameColor): GameState {
  const expectedColor = expectedColorAt(state, state.inputIndex);
  // Past the end of the sequence there is nothing to judge; treat the input as
  // a no-op rather than reading undefined off the end of the array.
  if (!expectedColor) return state;

  if (selectedColor.id !== expectedColor.id) {
    const newLives = state.lives - 1;
    if (newLives <= 0) {
      return { ...state, lives: 0, phase: 'gameover', streak: 0 };
    }
    // A seeded run redeals the identical level, so a retry never rerolls the
    // Daily into easier or harder content than anyone else got.
    const retryRng = rngFor(state.seed, state.level);
    return {
      ...state,
      lives: newLives,
      phase: 'fail',
      inputIndex: 0,
      streak: 0,
      comboMultiplier: 1,
      sequence: generateSequence(state.palette, state.levelConfig.sequenceLength, retryRng),
      stroopSequence: state.mode === 'stroop'
        ? generateStroopSequence(state.levelConfig.sequenceLength, retryRng)
        : [],
    };
  }

  const nextIndex = state.inputIndex + 1;
  const totalLength = state.mode === 'stroop'
    ? state.stroopSequence.length
    : state.sequence.length;

  if (nextIndex >= totalLength) {
    const basePoints = state.level * 10;
    const points = Math.round(basePoints * state.comboMultiplier);
    return {
      ...state,
      inputIndex: nextIndex,
      score: state.score + points,
      phase: 'success',
    };
  }

  return { ...state, inputIndex: nextIndex };
}

export function calculateTimeBonus(responseTimeMs: number, displayTimeMs: number): number {
  const ratio = Math.max(0, 1 - responseTimeMs / (displayTimeMs * 3));
  return Math.round(ratio * 50);
}

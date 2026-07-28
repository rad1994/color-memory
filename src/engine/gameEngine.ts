import { GAME_COLORS, GameColor } from '../constants/colors';
import { getLevelConfig, LevelConfig } from '../constants/levels';
import { STROOP_COLORS, StroopColor } from '../constants/stroop';

export type GameMode = 'classic' | 'stroop';

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
}

// Stroop mode always plays on the fixed four-color direction pad, so the
// palette never grows with the level the way it does in classic mode.
function paletteFor(mode: GameMode, levelConfig: LevelConfig): GameColor[] {
  return mode === 'stroop' ? STROOP_COLORS : GAME_COLORS.slice(0, levelConfig.paletteSize);
}

export function createInitialState(mode: GameMode): GameState {
  const levelConfig = getLevelConfig(1);
  const palette = paletteFor(mode, levelConfig);
  const sequence = generateSequence(palette, levelConfig.sequenceLength);

  return {
    mode,
    level: 1,
    lives: 3,
    score: 0,
    streak: 0,
    bestStreak: 0,
    comboMultiplier: 1,
    sequence,
    stroopSequence: mode === 'stroop' ? generateStroopSequence(levelConfig.sequenceLength) : [],
    palette,
    levelConfig,
    phase: 'ready',
    inputIndex: 0,
    wheelRotation: 0,
  };
}

export function generateSequence(palette: GameColor[], length: number): GameColor[] {
  const seq: GameColor[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(palette[Math.floor(Math.random() * palette.length)]);
  }
  return seq;
}

export function generateStroopSequence(length: number): StroopItem[] {
  const items: StroopItem[] = [];
  for (let i = 0; i < length; i++) {
    const ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    // The written word never matches the ink, and is always another color on the
    // pad — so reading it points at a real, wrong swipe direction. That response
    // conflict is what makes the interference bite.
    const conflicting = STROOP_COLORS.filter(c => c.id !== ink.id);
    const word = conflicting[Math.floor(Math.random() * conflicting.length)];
    items.push({ word, ink });
  }
  return items;
}

export function advanceLevel(state: GameState): GameState {
  const nextLevel = state.level + 1;
  const levelConfig = getLevelConfig(nextLevel);
  const palette = paletteFor(state.mode, levelConfig);
  const sequence = generateSequence(palette, levelConfig.sequenceLength);
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
    stroopSequence: state.mode === 'stroop' ? generateStroopSequence(levelConfig.sequenceLength) : [],
    phase: 'ready',
    inputIndex: 0,
    streak: newStreak,
    bestStreak,
    comboMultiplier,
    wheelRotation: state.wheelRotation + 45 + Math.random() * 90,
  };
}

export function handleInput(state: GameState, selectedColor: GameColor): GameState {
  const expectedColor = state.mode === 'stroop'
    ? state.stroopSequence[state.inputIndex].ink
    : state.sequence[state.inputIndex];

  if (selectedColor.id !== expectedColor.id) {
    const newLives = state.lives - 1;
    if (newLives <= 0) {
      return { ...state, lives: 0, phase: 'gameover', streak: 0 };
    }
    const newSequence = generateSequence(state.palette, state.levelConfig.sequenceLength);
    return {
      ...state,
      lives: newLives,
      phase: 'fail',
      inputIndex: 0,
      streak: 0,
      comboMultiplier: 1,
      sequence: newSequence,
      stroopSequence: state.mode === 'stroop'
        ? generateStroopSequence(state.levelConfig.sequenceLength)
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

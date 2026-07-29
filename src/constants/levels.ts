export interface LevelConfig {
  sequenceLength: number;
  displayTime: number; // ms each color stays lit
  gapTime: number;     // ms of darkness between colors
  paletteSize: number;
  shuffleBoard: boolean;
}

export interface Tier {
  name: string;
  from: number;
}

export const TIERS: Tier[] = [
  { name: 'WARM UP', from: 1 },
  { name: 'EASY',    from: 11 },
  { name: 'STEADY',  from: 26 },
  { name: 'TRICKY',  from: 46 },
  { name: 'SHARP',   from: 71 },
  { name: 'EXPERT',  from: 101 },
  { name: 'MASTER',  from: 141 },
];

// Human short-term memory holds roughly seven items, so length alone stops
// being a usable difficulty dial early. It grows slowly and caps out, after
// which the pressure comes from speed, a wider palette, and a shifting board.
const MAX_SEQUENCE = 15;
const MIN_DISPLAY = 240;
const MIN_GAP = 80;

export const SHUFFLE_FROM_LEVEL = 26;

export function getLevelConfig(level: number): LevelConfig {
  return {
    sequenceLength: Math.min(MAX_SEQUENCE, 3 + Math.floor((level - 1) / 3)),
    displayTime: Math.max(MIN_DISPLAY, 900 - (level - 1) * 5),
    gapTime: Math.max(MIN_GAP, 220 - (level - 1) * 2),
    paletteSize: Math.min(8, 4 + Math.floor((level - 1) / 10)),
    shuffleBoard: level >= SHUFFLE_FROM_LEVEL,
  };
}

export function getTierName(level: number): string {
  let name = TIERS[0].name;
  for (const tier of TIERS) {
    if (level >= tier.from) name = tier.name;
  }
  return name;
}

// Levels where something new appears, used to announce the change to the player.
export function getLevelMilestone(level: number): string | null {
  const previous = getLevelConfig(level - 1);
  const current = getLevelConfig(level);

  if (level > 1 && current.paletteSize > previous.paletteSize) {
    return `${current.paletteSize} COLORS NOW`;
  }
  if (level === SHUFFLE_FROM_LEVEL) {
    return 'THE BOARD SHUFFLES NOW';
  }
  if (level > 1 && current.sequenceLength > previous.sequenceLength) {
    return `${current.sequenceLength} TO REMEMBER`;
  }
  return null;
}

export const MOTIVATIONAL_TEXTS = [
  'Amazing!', 'Brilliant!', 'Incredible!', 'Unstoppable!',
  'Color Master!', 'Mind Blown!', 'On Fire!', 'Legendary!',
  'Genius!', 'Spectacular!', 'Phenomenal!', 'Superstar!',
  'Memory Wizard!', 'Flawless!', 'Unreal!', 'Beast Mode!',
];

export function getMotivationalText(level: number, streak: number): string {
  if (streak >= 10) return 'UNSTOPPABLE!';
  if (streak >= 5) return 'ON FIRE!';
  const idx = (level - 1) % MOTIVATIONAL_TEXTS.length;
  return MOTIVATIONAL_TEXTS[idx];
}

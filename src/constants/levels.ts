export interface LevelConfig {
  sequenceLength: number;
  displayTime: number; // ms each color stays lit
  gapTime: number;     // ms of darkness between colors
  answerTime: number;  // ms allowed per answer once it is the player's turn
  paletteSize: number;
  rotates: boolean;      // the ring turns between levels
  fakeFlashes: number;   // decoy flashes mixed into playback
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

// New mechanics arrive at the levels called out in the design sheet.
export const ROTATE_FROM_LEVEL = 29;
export const FAKE_FLASH_FROM_LEVEL = 31;

export function getLevelConfig(level: number): LevelConfig {
  return {
    sequenceLength: Math.min(MAX_SEQUENCE, 3 + Math.floor((level - 1) / 3)),
    displayTime: Math.max(MIN_DISPLAY, 900 - (level - 1) * 5),
    gapTime: Math.max(MIN_GAP, 220 - (level - 1) * 2),
    answerTime: Math.max(1500, 4000 - (level - 1) * 40),
    paletteSize: Math.min(8, 4 + Math.floor((level - 1) / 10)),
    rotates: level >= ROTATE_FROM_LEVEL,
    fakeFlashes:
      level < FAKE_FLASH_FROM_LEVEL
        ? 0
        : Math.min(3, 1 + Math.floor((level - FAKE_FLASH_FROM_LEVEL) / 20)),
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
  if (level === ROTATE_FROM_LEVEL) return 'THE BOARD ROTATES NOW';
  if (level === FAKE_FLASH_FROM_LEVEL) return 'WATCH FOR FAKE FLASHES';
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

export interface LevelConfig {
  sequenceLength: number;
  displayTime: number; // ms per color
  paletteSize: number;
}

export function getLevelConfig(level: number): LevelConfig {
  if (level <= 5) {
    return {
      sequenceLength: 2 + level,
      displayTime: 1000,
      paletteSize: 4,
    };
  }
  if (level <= 10) {
    return {
      sequenceLength: 4 + Math.ceil((level - 5) / 1),
      displayTime: 800,
      paletteSize: 5,
    };
  }
  if (level <= 15) {
    return {
      sequenceLength: 6 + Math.ceil((level - 10) / 1),
      displayTime: 600,
      paletteSize: 6,
    };
  }
  if (level <= 20) {
    return {
      sequenceLength: 8 + Math.ceil((level - 15) / 1),
      displayTime: 500,
      paletteSize: 6,
    };
  }
  return {
    sequenceLength: 10 + Math.floor((level - 20) / 2),
    displayTime: Math.max(300, 500 - (level - 20) * 10),
    paletteSize: 8,
  };
}

export const MOTIVATIONAL_TEXTS = [
  'Amazing!', 'Brilliant!', 'Incredible!', 'Unstoppable!',
  'Color Master!', 'Mind Blown!', 'On Fire!', 'Legendary!',
  'Genius!', 'Spectacular!', 'Phenomenal!', 'Superstar!',
  'Memory Wizard!', 'Flawless!', 'Unreal!', 'Beast Mode!',
];

export function getMotivationalText(level: number, streak: number): string {
  if (streak >= 10) return '🔥 UNSTOPPABLE! 🔥';
  if (streak >= 5) return '⚡ ON FIRE! ⚡';
  const idx = (level - 1) % MOTIVATIONAL_TEXTS.length;
  return MOTIVATIONAL_TEXTS[idx];
}

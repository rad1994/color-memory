export interface GameColor {
  id: string;
  name: string;
  hex: string;
  sound: number; // frequency in Hz for tone generation
}

// Palette taken from design/style-guide.png — the five tile colors, then four
// extras that extend the set on later levels while keeping the same saturation.
export const GAME_COLORS: GameColor[] = [
  { id: 'red',    name: 'RED',    hex: '#FF2D55', sound: 261 },
  { id: 'green',  name: 'GREEN',  hex: '#3DFF6E', sound: 329 },
  { id: 'blue',   name: 'BLUE',   hex: '#2E7BFF', sound: 392 },
  { id: 'yellow', name: 'YELLOW', hex: '#FFD426', sound: 440 },
  { id: 'purple', name: 'PURPLE', hex: '#C13BFF', sound: 523 },
  { id: 'orange', name: 'ORANGE', hex: '#FF8A1F', sound: 587 },
  { id: 'cyan',   name: 'CYAN',   hex: '#22E8E8', sound: 659 },
  { id: 'pink',   name: 'PINK',   hex: '#FF4FA3', sound: 698 },
];

export interface PoolColor extends GameColor {
  /** Colors sharing a family look alike; never put two of them on one board. */
  family: string;
}

// The wider set a custom palette is picked from. The first eight are the
// defaults above, so an untouched game behaves exactly as before.
export const COLOR_POOL: PoolColor[] = [
  { id: 'red',      name: 'RED',      hex: '#FF2D55', sound: 261, family: 'red' },
  { id: 'green',    name: 'GREEN',    hex: '#3DFF6E', sound: 329, family: 'green' },
  { id: 'blue',     name: 'BLUE',     hex: '#2E7BFF', sound: 392, family: 'blue' },
  { id: 'yellow',   name: 'YELLOW',   hex: '#FFD426', sound: 440, family: 'yellow' },
  { id: 'purple',   name: 'PURPLE',   hex: '#C13BFF', sound: 523, family: 'purple' },
  { id: 'orange',   name: 'ORANGE',   hex: '#FF8A1F', sound: 587, family: 'orange' },
  { id: 'cyan',     name: 'CYAN',     hex: '#22E8E8', sound: 659, family: 'teal' },
  { id: 'pink',     name: 'PINK',     hex: '#FF4FA3', sound: 698, family: 'pink' },
  { id: 'crimson',  name: 'CRIMSON',  hex: '#FF5C3B', sound: 277, family: 'red' },
  { id: 'amber',    name: 'AMBER',    hex: '#FFB020', sound: 349, family: 'orange' },
  { id: 'lime',     name: 'LIME',     hex: '#C6FF3D', sound: 415, family: 'yellow' },
  { id: 'emerald',  name: 'EMERALD',  hex: '#00E5A0', sound: 466, family: 'green' },
  { id: 'teal',     name: 'TEAL',     hex: '#20C4C4', sound: 554, family: 'teal' },
  { id: 'sky',      name: 'SKY',      hex: '#4FC3FF', sound: 622, family: 'blue' },
  { id: 'violet',   name: 'VIOLET',   hex: '#8B5CFF', sound: 740, family: 'purple' },
  { id: 'magenta',  name: 'MAGENTA',  hex: '#FF2FD0', sound: 784, family: 'pink' },
  { id: 'slate',    name: 'SLATE',    hex: '#96A6C8', sound: 830, family: 'neutral' },
  { id: 'brown',    name: 'BROWN',    hex: '#C08457', sound: 880, family: 'brown' },
];

export const MIN_PALETTE = 4;
export const MAX_PALETTE = 8;

export function poolColor(id: string): PoolColor | undefined {
  return COLOR_POOL.find(c => c.id === id);
}

/**
 * A random palette that is actually playable: one color per family, so no two
 * tiles on the board are near-lookalikes.
 */
export function randomPalette(size: number = MAX_PALETTE): string[] {
  const families = [...new Set(COLOR_POOL.map(c => c.family))];
  for (let i = families.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [families[i], families[j]] = [families[j], families[i]];
  }
  return families.slice(0, size).map(family => {
    const options = COLOR_POOL.filter(c => c.family === family);
    return options[Math.floor(Math.random() * options.length)].id;
  });
}

export const THEME = {
  bg: '#05060D',
  bgLight: '#0D1020',
  bgCard: '#111424',
  bgElevated: '#161B2E',
  text: '#FFFFFF',
  textDim: '#7C86A8',
  accent: '#2E7BFF',
  success: '#3DFF6E',
  warning: '#FFD426',
  danger: '#FF2D55',
  purple: '#C13BFF',
  cyan: '#22E8E8',
  border: 'rgba(120,150,255,0.14)',
};

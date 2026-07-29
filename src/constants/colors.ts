export interface GameColor {
  id: string;
  name: string;
  hex: string;
  sound: number; // frequency in Hz for tone generation
}

// Palette taken from design/style-guide.png — the five tile colors, then four
// extras that extend the set on later levels while keeping the same saturation.
export const GAME_COLORS: GameColor[] = [
  { id: 'red',    name: 'RED',    hex: '#EA3B30', sound: 261 },
  { id: 'green',  name: 'GREEN',  hex: '#2FA84F', sound: 329 },
  { id: 'blue',   name: 'BLUE',   hex: '#1B6DE8', sound: 392 },
  { id: 'yellow', name: 'YELLOW', hex: '#F5C518', sound: 440 },
  { id: 'purple', name: 'PURPLE', hex: '#8B3FE8', sound: 523 },
  { id: 'orange', name: 'ORANGE', hex: '#F0761E', sound: 587 },
  { id: 'cyan',   name: 'CYAN',   hex: '#17BEBB', sound: 659 },
  { id: 'pink',   name: 'PINK',   hex: '#E8407A', sound: 698 },
];

export interface PoolColor extends GameColor {
  /** Colors sharing a family look alike; never put two of them on one board. */
  family: string;
}

// The wider set a custom palette is picked from. The first eight are the
// defaults above, so an untouched game behaves exactly as before.
export const COLOR_POOL: PoolColor[] = [
  { id: 'red',      name: 'RED',      hex: '#EA3B30', sound: 261, family: 'red' },
  { id: 'green',    name: 'GREEN',    hex: '#2FA84F', sound: 329, family: 'green' },
  { id: 'blue',     name: 'BLUE',     hex: '#1B6DE8', sound: 392, family: 'blue' },
  { id: 'yellow',   name: 'YELLOW',   hex: '#F5C518', sound: 440, family: 'yellow' },
  { id: 'purple',   name: 'PURPLE',   hex: '#8B3FE8', sound: 523, family: 'purple' },
  { id: 'orange',   name: 'ORANGE',   hex: '#F0761E', sound: 587, family: 'orange' },
  { id: 'cyan',     name: 'CYAN',     hex: '#17BEBB', sound: 659, family: 'teal' },
  { id: 'pink',     name: 'PINK',     hex: '#E8407A', sound: 698, family: 'pink' },
  { id: 'crimson',  name: 'CRIMSON',  hex: '#B81D3A', sound: 277, family: 'red' },
  { id: 'amber',    name: 'AMBER',    hex: '#F59E0B', sound: 349, family: 'orange' },
  { id: 'lime',     name: 'LIME',     hex: '#A3D435', sound: 415, family: 'yellow' },
  { id: 'emerald',  name: 'EMERALD',  hex: '#0FA36B', sound: 466, family: 'green' },
  { id: 'teal',     name: 'TEAL',     hex: '#0E8C8C', sound: 554, family: 'teal' },
  { id: 'sky',      name: 'SKY',      hex: '#38A8F0', sound: 622, family: 'blue' },
  { id: 'violet',   name: 'VIOLET',   hex: '#6D3BD1', sound: 740, family: 'purple' },
  { id: 'magenta',  name: 'MAGENTA',  hex: '#D6249F', sound: 784, family: 'pink' },
  { id: 'slate',    name: 'SLATE',    hex: '#7A8794', sound: 830, family: 'neutral' },
  { id: 'brown',    name: 'BROWN',    hex: '#9C6B3F', sound: 880, family: 'brown' },
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
  bg: '#0A0A0F',
  bgLight: '#16161D',
  bgCard: '#1B1B23',
  bgElevated: '#22222B',
  text: '#FFFFFF',
  textDim: '#8A8A94',
  accent: '#1B6DE8',
  success: '#2FA84F',
  warning: '#F5C518',
  danger: '#EA3B30',
  purple: '#8B3FE8',
  border: 'rgba(255,255,255,0.08)',
};

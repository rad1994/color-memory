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

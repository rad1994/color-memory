export type ThemeId = 'classic' | 'pastel' | 'dark' | 'nature';

export interface ColorTheme {
  id: ThemeId;
  name: string;
  // Keyed by the color ids in GAME_COLORS. Every theme must define all of them,
  // and must keep them clearly distinguishable from one another — the whole game
  // is telling these apart, so a pretty palette that muddles two hues is a
  // broken palette, not just an ugly one.
  hexes: Record<string, string>;
}

export const THEMES: ColorTheme[] = [
  {
    id: 'classic',
    name: 'CLASSIC',
    hexes: {
      red: '#EA3B30',
      green: '#2FA84F',
      blue: '#1B6DE8',
      yellow: '#F5C518',
      purple: '#8B3FE8',
      orange: '#F0761E',
      cyan: '#17BEBB',
      pink: '#E8407A',
    },
  },
  {
    id: 'pastel',
    name: 'PASTEL',
    hexes: {
      red: '#FF9A9A',
      green: '#9FE3AC',
      blue: '#9BC1F7',
      yellow: '#FFE6A0',
      purple: '#CBA9F2',
      orange: '#FFC59B',
      cyan: '#9AE4E0',
      pink: '#F7B6D0',
    },
  },
  {
    id: 'dark',
    name: 'DARK',
    hexes: {
      red: '#B4453E',
      green: '#3D8757',
      blue: '#3A5FA8',
      yellow: '#B9962E',
      purple: '#6B4BA3',
      orange: '#B0672C',
      cyan: '#2E807D',
      pink: '#A04A6B',
    },
  },
  {
    id: 'nature',
    name: 'NATURE',
    hexes: {
      red: '#C0452E',
      green: '#4E8C3A',
      blue: '#3B6E9C',
      yellow: '#D6A828',
      purple: '#7B5A96',
      orange: '#C97B2C',
      cyan: '#3E9DA8',
      pink: '#BF7B8E',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'classic';

export function getTheme(id: string | undefined): ColorTheme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

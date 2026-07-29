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
    name: 'NEON',
    // Saturated and bright, because every node carries a glow behind it —
    // muted colors disappear against the halo.
    hexes: {
      red: '#FF2D55',
      green: '#3DFF6E',
      blue: '#2E7BFF',
      yellow: '#FFD426',
      purple: '#C13BFF',
      orange: '#FF8A1F',
      cyan: '#22E8E8',
      pink: '#FF4FA3',
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

import { GAME_COLORS, GameColor } from './colors';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface StroopColor extends GameColor {
  direction: SwipeDirection;
  arrow: string;
}

const DIRECTIONS: Record<string, { direction: SwipeDirection; arrow: string }> = {
  red:    { direction: 'left',  arrow: '←' },
  blue:   { direction: 'right', arrow: '→' },
  green:  { direction: 'up',    arrow: '↑' },
  yellow: { direction: 'down',  arrow: '↓' },
};

// Fixed four-way mapping. The set stays at four colors at every level so the
// direction mapping can become muscle memory — Stroop difficulty comes from the
// word fighting the ink, not from tracking which colors are in play.
export const STROOP_COLORS: StroopColor[] = Object.keys(DIRECTIONS).map(id => ({
  ...GAME_COLORS.find(c => c.id === id)!,
  ...DIRECTIONS[id],
}));

export const COLOR_BY_DIRECTION: Record<SwipeDirection, StroopColor> = STROOP_COLORS.reduce(
  (acc, color) => ({ ...acc, [color.direction]: color }),
  {} as Record<SwipeDirection, StroopColor>
);

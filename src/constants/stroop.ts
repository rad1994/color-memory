import { GameColor } from './colors';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface StroopColor extends GameColor {
  direction: SwipeDirection;
  arrow: string;
}

// Fixed four-way mapping. The set stays at four colors at every level so the
// direction mapping can become muscle memory — Stroop difficulty comes from the
// word fighting the ink, not from tracking which colors are in play.
export const STROOP_COLORS: StroopColor[] = [
  { id: 'red',    name: 'RED',    hex: '#FF4757', sound: 261, direction: 'left',  arrow: '←' },
  { id: 'blue',   name: 'BLUE',   hex: '#3742FA', sound: 329, direction: 'right', arrow: '→' },
  { id: 'green',  name: 'GREEN',  hex: '#2ED573', sound: 392, direction: 'up',    arrow: '↑' },
  { id: 'yellow', name: 'YELLOW', hex: '#FFC312', sound: 440, direction: 'down',  arrow: '↓' },
];

export const COLOR_BY_DIRECTION: Record<SwipeDirection, StroopColor> = STROOP_COLORS.reduce(
  (acc, color) => ({ ...acc, [color.direction]: color }),
  {} as Record<SwipeDirection, StroopColor>
);

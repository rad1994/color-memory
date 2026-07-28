export interface GameColor {
  id: string;
  name: string;
  hex: string;
  sound: number; // frequency in Hz for tone generation
}

export const GAME_COLORS: GameColor[] = [
  { id: 'red',    name: 'Red',    hex: '#FF4757', sound: 261 },
  { id: 'blue',   name: 'Blue',   hex: '#3742FA', sound: 329 },
  { id: 'green',  name: 'Green',  hex: '#2ED573', sound: 392 },
  { id: 'yellow', name: 'Yellow', hex: '#FFC312', sound: 440 },
  { id: 'purple', name: 'Purple', hex: '#A55EEA', sound: 523 },
  { id: 'orange', name: 'Orange', hex: '#FF6348', sound: 587 },
  { id: 'cyan',   name: 'Cyan',   hex: '#18DCFF', sound: 659 },
  { id: 'pink',   name: 'Pink',   hex: '#FF6B81', sound: 698 },
];

export const THEME = {
  bg: '#0F0F1A',
  bgLight: '#1A1A2E',
  bgCard: '#16213E',
  text: '#EAEAEA',
  textDim: '#7F8C8D',
  accent: '#E94560',
  accentGlow: 'rgba(233, 69, 96, 0.3)',
  success: '#2ED573',
  warning: '#FFC312',
  danger: '#FF4757',
};

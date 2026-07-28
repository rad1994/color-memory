export interface StroopObject {
  id: string;
  label: string;
  realColor: string; // what color the object actually is in real life
  emoji: string;
}

export const STROOP_OBJECTS: StroopObject[] = [
  { id: 'tree',     label: 'Tree',      realColor: 'green',  emoji: '🌳' },
  { id: 'sun',      label: 'Sun',       realColor: 'yellow', emoji: '☀️' },
  { id: 'ocean',    label: 'Ocean',     realColor: 'blue',   emoji: '🌊' },
  { id: 'fire',     label: 'Fire',      realColor: 'red',    emoji: '🔥' },
  { id: 'snow',     label: 'Snow',      realColor: 'white',  emoji: '❄️' },
  { id: 'grape',    label: 'Grape',     realColor: 'purple', emoji: '🍇' },
  { id: 'carrot',   label: 'Carrot',    realColor: 'orange', emoji: '🥕' },
  { id: 'grass',    label: 'Grass',     realColor: 'green',  emoji: '🌿' },
  { id: 'cherry',   label: 'Cherry',    realColor: 'red',    emoji: '🍒' },
  { id: 'sky',      label: 'Sky',       realColor: 'blue',   emoji: '🌤️' },
  { id: 'lemon',    label: 'Lemon',     realColor: 'yellow', emoji: '🍋' },
  { id: 'rose',     label: 'Rose',      realColor: 'red',    emoji: '🌹' },
  { id: 'eggplant', label: 'Eggplant',  realColor: 'purple', emoji: '🍆' },
  { id: 'pumpkin',  label: 'Pumpkin',   realColor: 'orange', emoji: '🎃' },
  { id: 'leaf',     label: 'Leaf',      realColor: 'green',  emoji: '🍃' },
  { id: 'cloud',    label: 'Cloud',     realColor: 'white',  emoji: '☁️' },
];

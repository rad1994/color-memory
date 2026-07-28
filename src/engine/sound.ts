import { Audio } from 'expo-av';

let soundObjects: Record<string, Audio.Sound> = {};

export async function playTone(frequency: number, durationMs: number = 150): Promise<void> {
  // expo-av doesn't generate tones directly — we use short placeholder beeps
  // In production, replace with actual sound assets per color
}

export async function playSuccess(): Promise<void> {
  // placeholder
}

export async function playFail(): Promise<void> {
  // placeholder
}

export async function playGameOver(): Promise<void> {
  // placeholder
}

export async function playTap(): Promise<void> {
  // placeholder
}

export function cleanup(): void {
  Object.values(soundObjects).forEach(s => s.unloadAsync().catch(() => {}));
  soundObjects = {};
}

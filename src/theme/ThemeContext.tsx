import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GameColor } from '../constants/colors';
import { ColorTheme, DEFAULT_THEME_ID, ThemeId, getTheme } from '../constants/themes';
import { getSettings, saveSettings } from '../engine/storage';

interface ThemeValue {
  theme: ColorTheme;
  setThemeId: (id: ThemeId) => void;
  /** Hex for a color id under the active theme. */
  hexFor: (colorId: string) => string;
  /** The same color with its hex swapped for the active theme's. */
  themed: (color: GameColor) => GameColor;
}

const ThemeContext = createContext<ThemeValue | null>(null);

// Game state stores whole GameColor objects, so rather than rebuilding the
// engine whenever the palette changes, the hex is resolved here at render time
// and keyed by the stable color id.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    getSettings().then(s => setThemeIdState((s.themeId as ThemeId) ?? DEFAULT_THEME_ID));
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const theme = getTheme(themeId);
    const hexFor = (colorId: string) => theme.hexes[colorId] ?? '#888888';
    return {
      theme,
      hexFor,
      themed: (color: GameColor) => ({ ...color, hex: hexFor(color.id) }),
      setThemeId: (id: ThemeId) => {
        setThemeIdState(id);
        getSettings().then(s => saveSettings({ ...s, themeId: id }));
      },
    };
  }, [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

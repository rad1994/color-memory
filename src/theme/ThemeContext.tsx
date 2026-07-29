import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GAME_COLORS, GameColor, poolColor } from '../constants/colors';
import { ColorTheme, DEFAULT_THEME_ID, ThemeId, getTheme } from '../constants/themes';
import { getSettings, saveSettings } from '../engine/storage';

interface ThemeValue {
  theme: ColorTheme;
  customPalette: string[];
  setThemeId: (id: ThemeId) => void;
  setCustomPalette: (ids: string[]) => void;
  /** Colors a classic run draws from — the custom pick, or the theme's set. */
  activePool: GameColor[];
  /**
   * Hex for a color id under the active theme. Colors outside the theme's set
   * (anything picked from the wider pool) fall back to their own hex.
   */
  hexFor: (colorId: string, fallback?: string) => string;
}

const ThemeContext = createContext<ThemeValue | null>(null);

// Game state stores whole GameColor objects, so rather than rebuilding the
// engine whenever the palette changes, the hex is resolved here at render time
// and keyed by the stable color id.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [customPalette, setCustomPaletteState] = useState<string[]>([]);

  useEffect(() => {
    getSettings().then(s => {
      setThemeIdState((s.themeId as ThemeId) ?? DEFAULT_THEME_ID);
      setCustomPaletteState(s.customPalette ?? []);
    });
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const theme = getTheme(themeId);
    const hexFor = (colorId: string, fallback?: string) =>
      theme.hexes[colorId] ?? fallback ?? '#888888';

    const picked = customPalette
      .map(poolColor)
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const persist = (patch: Partial<{ themeId: ThemeId; customPalette: string[] }>) => {
      getSettings().then(s => saveSettings({ ...s, ...patch }));
    };

    return {
      theme,
      customPalette,
      hexFor,
      // A custom pick replaces the theme's set; otherwise the eight defaults
      // are used and the theme just recolors them.
      activePool: picked.length > 0 ? picked : GAME_COLORS,
      setThemeId: (id: ThemeId) => {
        setThemeIdState(id);
        persist({ themeId: id });
      },
      setCustomPalette: (ids: string[]) => {
        setCustomPaletteState(ids);
        persist({ customPalette: ids });
      },
    };
  }, [themeId, customPalette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

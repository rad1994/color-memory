import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  THEME,
  COLOR_POOL,
  MIN_PALETTE,
  MAX_PALETTE,
  randomPalette,
} from '../constants/colors';
import { getSettings, saveSettings, GameSettings } from '../engine/storage';
import { THEMES } from '../constants/themes';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const { theme, setThemeId, customPalette, setCustomPalette } = useTheme();
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    hapticEnabled: true,
    showTutorial: true,
    themeId: theme.id,
    customPalette: [],
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const toggle = (key: keyof GameSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Sound Effects</Text>
            <Text style={styles.sublabel}>Play tones for each color</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={() => toggle('soundEnabled')}
            trackColor={{ false: THEME.bgLight, true: THEME.accent }}
            thumbColor={THEME.text}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Haptic Feedback</Text>
            <Text style={styles.sublabel}>Vibrate on interactions</Text>
          </View>
          <Switch
            value={settings.hapticEnabled}
            onValueChange={() => toggle('hapticEnabled')}
            trackColor={{ false: THEME.bgLight, true: THEME.accent }}
            thumbColor={THEME.text}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Show Tutorial</Text>
            <Text style={styles.sublabel}>Display hints for new players</Text>
          </View>
          <Switch
            value={settings.showTutorial}
            onValueChange={() => toggle('showTutorial')}
            trackColor={{ false: THEME.bgLight, true: THEME.accent }}
            thumbColor={THEME.text}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>COLOR THEME</Text>
      <View style={styles.themeGrid}>
        {THEMES.map(t => {
          const isActive = t.id === theme.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.themeCard, isActive && styles.themeCardActive]}
              onPress={() => setThemeId(t.id)}
              activeOpacity={0.85}
            >
              <View style={styles.swatchGrid}>
                {['red', 'green', 'blue', 'yellow'].map(id => (
                  <View key={id} style={[styles.swatch, { backgroundColor: t.hexes[id] }]} />
                ))}
              </View>
              <Text style={[styles.themeName, isActive && styles.themeNameActive]}>{t.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.paletteHeader}>
        <Text style={styles.sectionTitle}>YOUR COLORS</Text>
        <View style={styles.paletteActions}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => setCustomPalette(randomPalette())}
            activeOpacity={0.8}
          >
            <Text style={styles.smallButtonText}>RANDOM</Text>
          </TouchableOpacity>
          {customPalette.length > 0 && (
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => setCustomPalette([])}
              activeOpacity={0.8}
            >
              <Text style={styles.smallButtonText}>RESET</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.hint}>
        {customPalette.length === 0
          ? `Using the theme's colors. Pick ${MIN_PALETTE}–${MAX_PALETTE} to choose your own.`
          : `${customPalette.length} of ${MAX_PALETTE} chosen`}
      </Text>

      <View style={styles.poolGrid}>
        {COLOR_POOL.map(color => {
          const isPicked = customPalette.includes(color.id);
          const atLimit = customPalette.length >= MAX_PALETTE && !isPicked;
          return (
            <TouchableOpacity
              key={color.id}
              activeOpacity={0.8}
              disabled={atLimit}
              onPress={() =>
                setCustomPalette(
                  isPicked
                    ? customPalette.filter(id => id !== color.id)
                    : [...customPalette, color.id]
                )
              }
              style={[
                styles.poolSwatch,
                { backgroundColor: color.hex },
                isPicked && styles.poolSwatchPicked,
                atLimit && styles.poolSwatchDim,
              ]}
            >
              {isPicked && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          );
        })}
      </View>

      {customPalette.length > 0 && customPalette.length < MIN_PALETTE && (
        <Text style={styles.warning}>
          Pick at least {MIN_PALETTE} — fewer than that and the theme's colors are used instead.
        </Text>
      )}

      <Text style={styles.version}>Color Memory v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: THEME.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
  },
  placeholder: {
    width: 60,
  },
  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  sublabel: {
    fontSize: 12,
    color: THEME.textDim,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.textDim,
    letterSpacing: 2,
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 4,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeCard: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: {
    borderColor: THEME.accent,
  },
  swatchGrid: {
    width: 44,
    height: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  themeName: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
    color: THEME.textDim,
    letterSpacing: 1.2,
  },
  themeNameActive: {
    color: THEME.text,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paletteActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  smallButton: {
    backgroundColor: THEME.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  smallButtonText: {
    color: THEME.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  hint: {
    color: THEME.textDim,
    fontSize: 11,
    marginBottom: 12,
    marginLeft: 4,
  },
  poolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  poolSwatch: {
    width: 52,
    height: 52,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  poolSwatchPicked: {
    borderColor: '#FFFFFF',
  },
  poolSwatchDim: {
    opacity: 0.3,
  },
  warning: {
    color: THEME.warning,
    fontSize: 11,
    marginTop: 10,
    marginLeft: 4,
  },
  version: {
    textAlign: 'center',
    color: THEME.textDim,
    fontSize: 12,
    marginTop: 30,
    marginBottom: 30,
  },
});

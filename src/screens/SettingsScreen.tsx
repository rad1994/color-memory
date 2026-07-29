import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/colors';
import { getSettings, saveSettings, GameSettings } from '../engine/storage';
import { THEMES } from '../constants/themes';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const { theme, setThemeId } = useTheme();
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    hapticEnabled: true,
    showTutorial: true,
    themeId: theme.id,
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
  version: {
    textAlign: 'center',
    color: THEME.textDim,
    fontSize: 12,
    marginTop: 30,
    marginBottom: 30,
  },
});

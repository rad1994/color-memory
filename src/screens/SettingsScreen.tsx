import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { THEME } from '../constants/colors';
import { getSettings, saveSettings, GameSettings } from '../engine/storage';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    hapticEnabled: true,
    showTutorial: true,
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
    <View style={styles.container}>
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

      <Text style={styles.version}>Color Memory v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
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
  version: {
    textAlign: 'center',
    color: THEME.textDim,
    fontSize: 12,
    marginTop: 40,
  },
});

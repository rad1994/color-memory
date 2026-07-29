import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, GAME_COLORS } from '../constants/colors';
import { getAllStats, getDailyStatus, DailyStatus } from '../engine/storage';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  onStartGame: (mode: 'classic' | 'stroop') => void;
  onStartDaily: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

const LOGO_TILES = ['red', 'green', 'blue', 'yellow'];

export function HomeScreen({
  onStartGame,
  onStartDaily,
  onOpenStats,
  onOpenSettings,
  onOpenAchievements,
}: Props) {
  const { hexFor } = useTheme();
  const [stats, setStats] = useState({ classicHigh: 0, stroopHigh: 0 });
  const [daily, setDaily] = useState<DailyStatus | null>(null);

  const scale = useRef(new Animated.Value(0.85)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAllStats().then(s => setStats({ classicHigh: s.classicHigh, stroopHigh: s.stroopHigh }));
    getDailyStatus().then(setDaily);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 9 }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const bestScore = Math.max(stats.classicHigh, stats.stroopHigh);
  const playedToday = daily?.playedToday ?? false;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoBlock, { opacity: fade, transform: [{ scale }] }]}>
        <View style={styles.logoCard}>
          <View style={styles.logoGrid}>
            {LOGO_TILES.map(id => (
              <View key={id} style={[styles.logoTile, { backgroundColor: hexFor(id) }]} />
            ))}
          </View>
        </View>

        <Text style={styles.wordmarkTop}>MEMORY</Text>
        <View style={styles.wordmarkRow}>
          {'COLORS'.split('').map((letter, i) => (
            <Text
              key={i}
              style={[styles.wordmarkLetter, { color: hexFor(GAME_COLORS[i % GAME_COLORS.length].id) }]}
            >
              {letter}
            </Text>
          ))}
        </View>

        {bestScore > 0 && <Text style={styles.best}>BEST {bestScore.toLocaleString()}</Text>}
      </Animated.View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: THEME.accent }]}
          onPress={() => onStartGame('classic')}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={20} color={THEME.text} />
          <Text style={styles.primaryLabel}>PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: THEME.success },
            playedToday && styles.buttonDone,
          ]}
          onPress={onStartDaily}
          disabled={playedToday}
          activeOpacity={0.85}
        >
          <Ionicons
            name={playedToday ? 'checkmark-circle' : 'calendar'}
            size={20}
            color={THEME.text}
          />
          <View style={styles.dailyLabels}>
            <Text style={styles.primaryLabel}>DAILY CHALLENGE</Text>
            <Text style={styles.dailySub}>
              {playedToday
                ? `Done today — ${daily?.lastScore.toLocaleString()} pts`
                : 'Same puzzle for everyone today'}
            </Text>
          </View>
          {!!daily?.streak && (
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={12} color={THEME.warning} />
              <Text style={styles.streakChipText}>{daily.streak}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: THEME.purple }]}
          onPress={() => onStartGame('stroop')}
          activeOpacity={0.85}
        >
          <Ionicons name="color-palette" size={20} color={THEME.text} />
          <Text style={styles.primaryLabel}>STROOP MODE</Text>
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <IconAction icon="stats-chart" label="STATS" onPress={onOpenStats} />
          <IconAction icon="trophy" label="SCORES" onPress={onOpenAchievements} />
          <IconAction icon="settings-sharp" label="SETTINGS" onPress={onOpenSettings} />
        </View>
      </View>
    </View>
  );
}

function IconAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.iconAction} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={22} color={THEME.text} />
      </View>
      <Text style={styles.iconLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCard: {
    width: 118,
    height: 118,
    borderRadius: 28,
    backgroundColor: THEME.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGrid: {
    width: 86,
    height: 86,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  logoTile: {
    width: 39,
    height: 39,
    borderRadius: 10,
  },
  wordmarkTop: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 5,
    marginTop: 20,
  },
  wordmarkRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  wordmarkLetter: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 5,
  },
  best: {
    marginTop: 14,
    color: THEME.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  actions: {
    width: '100%',
    maxWidth: 340,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 11,
  },
  buttonDone: {
    opacity: 0.45,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1.4,
  },
  dailyLabels: {
    flex: 1,
  },
  dailySub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  streakChipText: {
    color: THEME.warning,
    fontWeight: '900',
    fontSize: 12,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
  },
  iconAction: {
    alignItems: 'center',
    gap: 7,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: THEME.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textDim,
    letterSpacing: 1,
  },
});

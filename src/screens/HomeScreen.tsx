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
import { getAllStats } from '../engine/storage';

interface Props {
  onStartGame: (mode: 'classic' | 'stroop') => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

const LOGO_TILES = ['red', 'green', 'blue', 'yellow'];

export function HomeScreen({ onStartGame, onOpenStats, onOpenSettings, onOpenAchievements }: Props) {
  const [stats, setStats] = useState({
    classicHigh: 0, stroopHigh: 0, classicLevel: 0, stroopLevel: 0, bestStreak: 0, totalGames: 0,
  });

  const scale = useRef(new Animated.Value(0.85)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAllStats().then(setStats);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 9 }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const bestScore = Math.max(stats.classicHigh, stats.stroopHigh);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoBlock, { opacity: fade, transform: [{ scale }] }]}>
        <View style={styles.logoCard}>
          <View style={styles.logoGrid}>
            {LOGO_TILES.map(id => (
              <View
                key={id}
                style={[
                  styles.logoTile,
                  { backgroundColor: GAME_COLORS.find(c => c.id === id)!.hex },
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.wordmarkTop}>MEMORY</Text>
        <View style={styles.wordmarkRow}>
          {'COLORS'.split('').map((letter, i) => (
            <Text
              key={i}
              style={[styles.wordmarkLetter, { color: GAME_COLORS[i % GAME_COLORS.length].hex }]}
            >
              {letter}
            </Text>
          ))}
        </View>

        {bestScore > 0 && (
          <Text style={styles.best}>BEST {bestScore.toLocaleString()}</Text>
        )}
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
    marginBottom: 56,
  },
  logoCard: {
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: THEME.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGrid: {
    width: 96,
    height: 96,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
  wordmarkTop: {
    fontSize: 34,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 5,
    marginTop: 22,
  },
  wordmarkRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  wordmarkLetter: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 5,
  },
  best: {
    marginTop: 16,
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
    paddingVertical: 17,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1.5,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 14,
  },
  iconAction: {
    alignItems: 'center',
    gap: 7,
  },
  iconTile: {
    width: 58,
    height: 58,
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

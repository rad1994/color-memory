import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { THEME, GAME_COLORS } from '../constants/colors';
import { getAllStats } from '../engine/storage';

const { width } = Dimensions.get('window');

interface Props {
  onStartGame: (mode: 'classic' | 'stroop') => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

export function HomeScreen({ onStartGame, onOpenStats, onOpenSettings, onOpenAchievements }: Props) {
  const [stats, setStats] = useState({ classicHigh: 0, stroopHigh: 0, classicLevel: 0, stroopLevel: 0, bestStreak: 0, totalGames: 0 });
  const titleScale = new Animated.Value(0.8);
  const titleOpacity = new Animated.Value(0);

  useEffect(() => {
    getAllStats().then(setStats);
    Animated.parallel([
      Animated.spring(titleScale, { toValue: 1, useNativeDriver: true, speed: 8 }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgDots}>
        {GAME_COLORS.slice(0, 6).map((c, i) => (
          <View
            key={c.id}
            style={[
              styles.bgDot,
              {
                backgroundColor: c.hex,
                opacity: 0.08,
                left: `${15 + i * 15}%` as any,
                top: `${10 + (i % 3) * 30}%` as any,
                width: 60 + i * 20,
                height: 60 + i * 20,
                borderRadius: 30 + i * 10,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }], opacity: titleOpacity }]}>
        <Text style={styles.titleColor}>COLOR</Text>
        <Text style={styles.titleMemory}>MEMORY</Text>
        {stats.classicHigh > 0 && (
          <Text style={styles.highScore}>Best: {stats.classicHigh} pts</Text>
        )}
      </Animated.View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => onStartGame('classic')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>🎨</Text>
          <View>
            <Text style={styles.buttonText}>Classic Mode</Text>
            <Text style={styles.buttonSub}>Remember the color sequence</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stroopButton]}
          onPress={() => onStartGame('stroop')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>🧠</Text>
          <View>
            <Text style={styles.buttonText}>Stroop Mode</Text>
            <Text style={styles.buttonSub}>Swipe the ink, not the word</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenStats} activeOpacity={0.8}>
            <Text style={styles.secondaryIcon}>📊</Text>
            <Text style={styles.secondaryText}>Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenAchievements} activeOpacity={0.8}>
            <Text style={styles.secondaryIcon}>🏆</Text>
            <Text style={styles.secondaryText}>Awards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenSettings} activeOpacity={0.8}>
            <Text style={styles.secondaryIcon}>⚙️</Text>
            <Text style={styles.secondaryText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bgDots: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgDot: {
    position: 'absolute',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleColor: {
    fontSize: 52,
    fontWeight: '900',
    color: THEME.accent,
    letterSpacing: 8,
  },
  titleMemory: {
    fontSize: 36,
    fontWeight: '300',
    color: THEME.text,
    letterSpacing: 12,
    marginTop: -4,
  },
  highScore: {
    fontSize: 14,
    color: THEME.textDim,
    marginTop: 12,
  },
  buttons: {
    width: '100%',
    maxWidth: 340,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: THEME.accent,
  },
  stroopButton: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  buttonSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    backgroundColor: THEME.bgLight,
    borderRadius: 12,
  },
  secondaryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 12,
    color: THEME.textDim,
    fontWeight: '600',
  },
});

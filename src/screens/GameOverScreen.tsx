import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/colors';
import { Achievement } from '../engine/storage';

interface Props {
  score: number;
  level: number;
  mode: 'classic' | 'stroop';
  newAchievements: Achievement[];
  onPlayAgain: () => void;
  onHome: () => void;
}

export function GameOverScreen({ score, level, mode, newAchievements, onPlayAgain, onHome }: Props) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, useNativeDriver: true, speed: 8 }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.gameOverText}>Game Over</Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Level Reached</Text>
            <Text style={styles.statValue}>{level}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Mode</Text>
            <Text style={styles.statValue}>{mode === 'classic' ? 'Classic' : 'Stroop'}</Text>
          </View>
        </View>

        {newAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.achievementsTitle}>🏆 New Achievements!</Text>
            <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
              {newAchievements.map(a => (
                <View key={a.id} style={styles.achievementItem}>
                  <Text style={styles.achievementName}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain} activeOpacity={0.8}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={onHome} activeOpacity={0.8}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
      </Animated.View>
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
  content: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 42,
    fontWeight: '900',
    color: THEME.accent,
    marginBottom: 32,
    letterSpacing: 2,
  },
  statsCard: {
    width: '100%',
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: THEME.textDim,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  achievementsSection: {
    width: '100%',
    marginBottom: 24,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.warning,
    marginBottom: 12,
    textAlign: 'center',
  },
  achievementsList: {
    maxHeight: 140,
  },
  achievementItem: {
    backgroundColor: THEME.bgLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.warning,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  achievementDesc: {
    fontSize: 12,
    color: THEME.textDim,
    marginTop: 2,
  },
  playAgainButton: {
    width: '100%',
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    textAlign: 'center',
  },
  homeButton: {
    width: '100%',
    backgroundColor: THEME.bgLight,
    paddingVertical: 14,
    borderRadius: 14,
  },
  homeText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textDim,
    textAlign: 'center',
  },
});

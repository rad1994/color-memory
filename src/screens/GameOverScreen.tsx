import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/colors';
import { Achievement } from '../engine/storage';

interface Props {
  score: number;
  level: number;
  mode: 'classic' | 'stroop' | 'daily';
  newAchievements: Achievement[];
  isNewRecord?: boolean;
  /** Omitted when the run cannot be retried, as with the once-a-day Daily. */
  onPlayAgain?: () => void;
  onHome: () => void;
}

const MODE_LABELS: Record<Props['mode'], string> = {
  classic: 'CLASSIC',
  stroop: 'STROOP',
  daily: 'DAILY',
};

export function GameOverScreen({
  score,
  level,
  mode,
  newAchievements,
  isNewRecord,
  onPlayAgain,
  onHome,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, speed: 9 }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: rise }] }]}>
        <View style={[styles.badge, { backgroundColor: isNewRecord ? THEME.accent : THEME.danger }]}>
          <Ionicons name={isNewRecord ? 'trophy' : 'heart-dislike'} size={34} color={THEME.text} />
        </View>

        <Text style={styles.title}>{isNewRecord ? 'NEW RECORD!' : 'OUT OF LIVES'}</Text>
        <Text style={styles.score}>{score.toLocaleString()}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{level}</Text>
            <Text style={styles.metaLabel}>LEVEL</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{MODE_LABELS[mode]}</Text>
            <Text style={styles.metaLabel}>MODE</Text>
          </View>
        </View>

        {newAchievements.length > 0 && (
          <ScrollView style={styles.achievements} showsVerticalScrollIndicator={false}>
            {newAchievements.map(a => (
              <View key={a.id} style={styles.achievementRow}>
                <Ionicons name="trophy" size={16} color={THEME.warning} />
                <View style={styles.achievementText}>
                  <Text style={styles.achievementName}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {onPlayAgain ? (
          <TouchableOpacity style={styles.playAgain} onPress={onPlayAgain} activeOpacity={0.85}>
            <Ionicons name="refresh" size={18} color={THEME.text} />
            <Text style={styles.playAgainLabel}>PLAY AGAIN</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.comeBack}>One attempt a day — come back tomorrow</Text>
        )}

        <TouchableOpacity
          style={[styles.home, !onPlayAgain && styles.homeSolo]}
          onPress={onHome}
          activeOpacity={0.85}
        >
          <Text style={styles.homeLabel}>HOME</Text>
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
    paddingHorizontal: 26,
  },
  card: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: THEME.bgCard,
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
  },
  badge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -52,
    marginBottom: 14,
    borderWidth: 5,
    borderColor: THEME.bgCard,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.textDim,
    letterSpacing: 2,
  },
  score: {
    fontSize: 44,
    fontWeight: '900',
    color: THEME.text,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  metaItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  metaValue: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textDim,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.border,
  },
  achievements: {
    alignSelf: 'stretch',
    maxHeight: 120,
    marginTop: 14,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.bgLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
  },
  achievementText: {
    flex: 1,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
  },
  achievementDesc: {
    fontSize: 11,
    color: THEME.textDim,
  },
  playAgain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: THEME.accent,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 20,
  },
  playAgainLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1.2,
  },
  comeBack: {
    fontSize: 12,
    color: THEME.textDim,
    textAlign: 'center',
    marginTop: 22,
  },
  home: {
    alignSelf: 'stretch',
    paddingVertical: 13,
    marginTop: 8,
  },
  homeSolo: {
    backgroundColor: THEME.accent,
    borderRadius: 13,
    marginTop: 14,
  },
  homeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDim,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});

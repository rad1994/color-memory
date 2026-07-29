import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/colors';
import { getAllStats, getUnlockedAchievements, ACHIEVEMENT_DEFS, Achievement } from '../engine/storage';

interface Props {
  onBack: () => void;
  showAchievements?: boolean;
}

export function StatsScreen({ onBack, showAchievements = false }: Props) {
  const [stats, setStats] = useState({
    classicHigh: 0, stroopHigh: 0, dailyHigh: 0,
    classicLevel: 0, stroopLevel: 0, dailyLevel: 0,
    bestStreak: 0, totalGames: 0, dailyStreak: 0, dailyBestStreak: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    getAllStats().then(setStats);
    getUnlockedAchievements().then(setAchievements);
  }, []);

  const unlockedIds = new Set(achievements.map(a => a.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{showAchievements ? 'Achievements' : 'Statistics'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!showAchievements && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Classic Mode</Text>
              <View style={styles.statGrid}>
                <StatBox label="High Score" value={stats.classicHigh.toString()} />
                <StatBox label="Best Level" value={stats.classicLevel.toString()} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stroop Mode</Text>
              <View style={styles.statGrid}>
                <StatBox label="High Score" value={stats.stroopHigh.toString()} />
                <StatBox label="Best Level" value={stats.stroopLevel.toString()} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Challenge</Text>
              <View style={styles.statGrid}>
                <StatBox label="High Score" value={stats.dailyHigh.toLocaleString()} />
                <StatBox label="Day Streak" value={stats.dailyStreak.toString()} />
              </View>
              <View style={[styles.statGrid, { marginTop: 12 }]}>
                <StatBox label="Best Level" value={stats.dailyLevel.toString()} />
                <StatBox label="Best Day Streak" value={stats.dailyBestStreak.toString()} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Overall</Text>
              <View style={styles.statGrid}>
                <StatBox label="Best Streak" value={`🔥 ${stats.bestStreak}`} />
                <StatBox label="Games Played" value={stats.totalGames.toString()} />
              </View>
            </View>
          </>
        )}

        {showAchievements && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {achievements.length} / {ACHIEVEMENT_DEFS.length} Unlocked
            </Text>
            {ACHIEVEMENT_DEFS.map(def => {
              const isUnlocked = unlockedIds.has(def.id);
              return (
                <View
                  key={def.id}
                  style={[styles.achievementRow, !isUnlocked && styles.achievementLocked]}
                >
                  <Text style={styles.achievementIcon}>{isUnlocked ? '🏆' : '🔒'}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementName, !isUnlocked && styles.lockedText]}>
                      {def.title}
                    </Text>
                    <Text style={[styles.achievementDesc, !isUnlocked && styles.lockedText]}>
                      {def.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    marginBottom: 24,
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
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textDim,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.bgLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textDim,
    marginTop: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
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
  lockedText: {
    color: THEME.textDim,
  },
});

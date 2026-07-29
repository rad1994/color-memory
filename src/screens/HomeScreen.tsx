import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, GAME_COLORS } from '../constants/colors';
import { getAllStats, getDailyStatus, DailyStatus } from '../engine/storage';
import { useTheme } from '../theme/ThemeContext';

type PlayableMode = 'classic' | 'reversed' | 'stroop';

interface Props {
  onStartGame: (mode: PlayableMode) => void;
  onStartDaily: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

interface ModeCard {
  mode: PlayableMode | 'locked';
  title: string;
  blurb: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colorId: string;
}

const MODES: ModeCard[] = [
  { mode: 'classic',  title: 'CLASSIC',      blurb: 'Repeat the color sequence',   icon: 'play',           colorId: 'cyan' },
  { mode: 'reversed', title: 'REVERSED',     blurb: 'Repeat it backwards',         icon: 'swap-horizontal', colorId: 'orange' },
  { mode: 'stroop',   title: 'STROOP',       blurb: 'The color, not the word',     icon: 'color-palette',  colorId: 'purple' },
  { mode: 'locked',   title: 'DUAL MEMORY',  blurb: 'Colors and sounds at once',   icon: 'musical-notes',  colorId: 'green' },
  { mode: 'locked',   title: 'CHALLENGE',    blurb: 'Timed precision trials',      icon: 'lock-closed',    colorId: 'pink' },
];

export function HomeScreen({
  onStartGame,
  onStartDaily,
  onOpenStats,
  onOpenSettings,
  onOpenAchievements,
}: Props) {
  const { hexFor } = useTheme();
  const [best, setBest] = useState(0);
  const [daily, setDaily] = useState<DailyStatus | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAllStats().then(s => setBest(Math.max(s.classicHigh, s.stroopHigh, s.dailyHigh)));
    getDailyStatus().then(setDaily);
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const playedToday = daily?.playedToday ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={{ opacity: fade }}>
        <Text style={styles.neon}>NEON</Text>
        <View style={styles.nexusRow}>
          {'NEXUS'.split('').map((letter, i) => (
            <Text
              key={i}
              style={[styles.nexusLetter, { color: hexFor(GAME_COLORS[(i + 4) % GAME_COLORS.length].id) }]}
            >
              {letter}
            </Text>
          ))}
        </View>
        <Text style={styles.subtitle}>MEMORY COLOUR</Text>
        {best > 0 && <Text style={styles.best}>BEST {best.toLocaleString()}</Text>}
      </Animated.View>

      <TouchableOpacity
        style={[styles.daily, playedToday && styles.dailyDone]}
        onPress={onStartDaily}
        disabled={playedToday}
        activeOpacity={0.85}
      >
        <Ionicons
          name={playedToday ? 'checkmark-circle' : 'gift'}
          size={22}
          color={playedToday ? THEME.textDim : THEME.warning}
        />
        <View style={styles.dailyLabels}>
          <Text style={styles.dailyTitle}>DAILY CHALLENGE</Text>
          <Text style={styles.dailyBlurb}>
            {playedToday
              ? `Done today — ${daily?.lastScore.toLocaleString()} pts`
              : 'Same puzzle for everyone today'}
          </Text>
        </View>
        {!!daily?.streak && (
          <View style={styles.streakChip}>
            <Ionicons name="flame" size={11} color={THEME.warning} />
            <Text style={styles.streakText}>{daily.streak}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>GAME MODES</Text>

      {MODES.map(card => {
        const locked = card.mode === 'locked';
        const accent = hexFor(card.colorId);
        return (
          <TouchableOpacity
            key={card.title}
            style={[styles.modeCard, { borderColor: locked ? THEME.border : accent + '66' }, locked && styles.modeLocked]}
            onPress={() => !locked && onStartGame(card.mode as PlayableMode)}
            disabled={locked}
            activeOpacity={0.85}
          >
            <View style={[styles.modeIcon, { backgroundColor: locked ? THEME.bgElevated : accent + '22' }]}>
              <Ionicons name={card.icon} size={19} color={locked ? THEME.textDim : accent} />
            </View>
            <View style={styles.modeLabels}>
              <Text style={[styles.modeTitle, locked && styles.lockedText]}>{card.title}</Text>
              <Text style={styles.modeBlurb}>{locked ? 'Coming soon' : card.blurb}</Text>
            </View>
            {!locked && <Ionicons name="chevron-forward" size={17} color={THEME.textDim} />}
          </TouchableOpacity>
        );
      })}

      <View style={styles.iconRow}>
        <IconAction icon="stats-chart" label="STATS" onPress={onOpenStats} />
        <IconAction icon="trophy" label="AWARDS" onPress={onOpenAchievements} />
        <IconAction icon="settings-sharp" label="SETTINGS" onPress={onOpenSettings} />
      </View>
    </ScrollView>
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
        <Ionicons name={icon} size={20} color={THEME.text} />
      </View>
      <Text style={styles.iconLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 40 },
  neon: {
    fontSize: 44,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 6,
  },
  nexusRow: { flexDirection: 'row', marginTop: -6 },
  nexusLetter: { fontSize: 44, fontWeight: '900', letterSpacing: 6 },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.textDim,
    letterSpacing: 5,
    marginTop: 6,
  },
  best: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.warning,
    letterSpacing: 2,
    marginTop: 10,
  },
  daily: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,212,38,0.35)',
    borderRadius: 15,
    padding: 15,
    marginTop: 26,
  },
  dailyDone: { opacity: 0.5, borderColor: THEME.border },
  dailyLabels: { flex: 1 },
  dailyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1.4,
  },
  dailyBlurb: { fontSize: 11, color: THEME.textDim, marginTop: 2 },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,212,38,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: { color: THEME.warning, fontWeight: '900', fontSize: 11 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.textDim,
    letterSpacing: 2.5,
    marginTop: 26,
    marginBottom: 12,
    marginLeft: 2,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
  },
  modeLocked: { opacity: 0.45 },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeLabels: { flex: 1 },
  modeTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1.4,
  },
  lockedText: { color: THEME.textDim },
  modeBlurb: { fontSize: 11, color: THEME.textDim, marginTop: 2 },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 20,
  },
  iconAction: { alignItems: 'center', gap: 6 },
  iconTile: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textDim,
    letterSpacing: 1.2,
  },
});

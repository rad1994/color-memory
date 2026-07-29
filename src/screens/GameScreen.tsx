import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME, GameColor } from '../constants/colors';
import { getMotivationalText, getTierName, getLevelMilestone } from '../constants/levels';
import { COLOR_BY_DIRECTION, STROOP_COLORS, SwipeDirection } from '../constants/stroop';
import {
  GameState,
  GameMode,
  PlaybackStep,
  createInitialState,
  handleInput,
  advanceLevel,
  applyHint,
  buildPlayback,
  loseLife,
} from '../engine/gameEngine';
import { saveGameResult, getSettings, getHighScore, Achievement } from '../engine/storage';
import { useTheme } from '../theme/ThemeContext';
import { NodeBoard } from '../components/NodeBoard';
import { SwipePad } from '../components/SwipePad';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HINT_VISIBLE_MS = 1400;

interface Props {
  mode: GameMode;
  seed?: number | null;
  onGameOver: (
    score: number,
    level: number,
    newAchievements: Achievement[],
    isNewRecord: boolean
  ) => void;
  onBack: () => void;
}

export function GameScreen({ mode, seed = null, onGameOver, onBack }: Props) {
  const { hexFor, activePool } = useTheme();
  const [state, setState] = useState<GameState>(() =>
    createInitialState(mode, { seed, pool: mode === 'daily' ? undefined : activePool })
  );
  const [playback, setPlayback] = useState<PlaybackStep[]>([]);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [motivText, setMotivText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [hintColor, setHintColor] = useState<GameColor | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [settings, setSettings] = useState({ soundEnabled: true, hapticEnabled: true, showTutorial: true });

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const motivAnim = useRef(new Animated.Value(0)).current;
  const savedRef = useRef(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const recordRun = useCallback(async () => {
    if (savedRef.current) return { achievements: [] as Achievement[], isNewRecord: false };
    savedRef.current = true;
    const storedMode = mode === 'stroop' ? 'stroop' : mode === 'daily' ? 'daily' : 'classic';
    const previousBest = await getHighScore(storedMode);
    const achievements = await saveGameResult(storedMode, state.score, state.level, state.bestStreak);
    return { achievements, isNewRecord: state.score > previousBest };
  }, [mode, state.score, state.level, state.bestStreak]);

  const quitToMenu = useCallback(async () => {
    await recordRun();
    onBack();
  }, [recordRun, onBack]);

  useEffect(() => {
    if (isPaused) return;
    if (state.phase === 'ready') {
      const timer = setTimeout(() => setState(s => ({ ...s, phase: 'showing' })), 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.level, isPaused]);

  // Pausing tears this down and unpausing re-runs it, so the sequence replays
  // from the start rather than resuming mid-pattern.
  useEffect(() => {
    if (isPaused || state.phase !== 'showing') return;

    const steps = buildPlayback(state);
    setPlayback(steps);
    let current = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setShowingIndex(-1);

    const showNext = () => {
      if (current >= steps.length) {
        setShowingIndex(-1);
        setState(s => ({ ...s, phase: 'input' }));
        return;
      }
      setShowingIndex(current);
      if (settings.hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      current++;
      timers.push(setTimeout(() => {
        setShowingIndex(-1);
        timers.push(setTimeout(showNext, state.levelConfig.gapTime));
      }, state.levelConfig.displayTime));
    };

    timers.push(setTimeout(showNext, 400));
    return () => timers.forEach(clearTimeout);
  }, [state.phase, state.level, isPaused]);

  // Answer clock. It restarts on every accepted input, and running out costs a
  // life exactly as a wrong answer does.
  useEffect(() => {
    if (state.phase !== 'input' || isPaused) {
      setTimeLeft(0);
      return;
    }
    const limit = state.levelConfig.answerTime;
    const startedAt = Date.now();
    setTimeLeft(limit);

    const tick = setInterval(() => {
      const remaining = limit - (Date.now() - startedAt);
      if (remaining <= 0) {
        clearInterval(tick);
        setTimeLeft(0);
        setState(s => (s.phase === 'input' ? loseLife(s) : s));
      } else {
        setTimeLeft(remaining);
      }
    }, 50);

    return () => clearInterval(tick);
  }, [state.phase, state.inputIndex, state.level, isPaused]);

  useEffect(() => {
    if (state.phase === 'success') {
      setHintColor(null);
      setMotivText(getMotivationalText(state.level, state.streak));
      Animated.sequence([
        Animated.timing(motivAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(750),
        Animated.timing(motivAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setState(s => advanceLevel(s)));

      Animated.sequence([
        Animated.timing(scorePopAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scorePopAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      if (settings.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }
  }, [state.phase === 'success']);

  useEffect(() => {
    if (state.phase === 'fail') {
      setHintColor(null);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => setState(s => ({ ...s, phase: 'ready' })), 600);
      });
      if (settings.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  }, [state.phase === 'fail']);

  useEffect(() => {
    if (state.phase === 'gameover') {
      recordRun().then(({ achievements, isNewRecord }) => {
        setTimeout(() => onGameOver(state.score, state.level, achievements, isNewRecord), 500);
      });
      if (settings.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  }, [state.phase === 'gameover']);

  const onColorPress = useCallback((color: GameColor) => {
    if (isPaused) return;
    if (settings.hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setHintColor(null);
    // Re-checked against the latest state so two taps in one frame cannot both
    // be judged, which would score the second against an already-passed step.
    setState(s => (s.phase === 'input' ? handleInput(s, color) : s));
  }, [isPaused, settings.hapticEnabled]);

  const onSwipe = useCallback((direction: SwipeDirection) => {
    onColorPress(COLOR_BY_DIRECTION[direction]);
  }, [onColorPress]);

  const onHint = useCallback(() => {
    if (state.phase !== 'input' || isPaused || state.hintsRemaining <= 0) return;
    const { state: next, revealed } = applyHint(state);
    if (!revealed) return;
    setState(next);
    setHintColor(revealed);
    setTimeout(() => setHintColor(null), HINT_VISIBLE_MS);
  }, [state, isPaused]);

  const isShowing = state.phase === 'showing' && !isPaused;
  const canHint = state.phase === 'input' && !isPaused && state.hintsRemaining > 0;
  const currentStep = isShowing && showingIndex >= 0 ? playback[showingIndex] : null;
  const total = mode === 'stroop' ? state.stroopSequence.length : state.sequence.length;

  const centerLabel = () => {
    if (isPaused) return '';
    switch (state.phase) {
      case 'ready':   return getLevelMilestone(state.level) ?? 'GET READY';
      case 'showing': return 'MEMORIZE\nTHE SEQUENCE';
      case 'input':   return mode === 'reversed' ? 'REPEAT\nBACKWARDS' : 'YOUR TURN';
      case 'fail':    return 'WRONG';
      default:        return '';
    }
  };

  const hintDirection = hintColor
    ? STROOP_COLORS.find(c => c.id === hintColor.id)?.direction ?? null
    : null;

  const timerRatio = state.levelConfig.answerTime
    ? Math.max(0, timeLeft / state.levelConfig.answerTime)
    : 0;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setIsPaused(true)}
          style={styles.iconButton}
          activeOpacity={0.7}
          disabled={state.phase === 'gameover'}
        >
          <Ionicons name="pause" size={19} color={THEME.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.levelTitle}>LEVEL {state.level}</Text>
          <View style={styles.lives}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < state.lives ? 'heart' : 'heart-outline'}
                size={15}
                color={i < state.lives ? THEME.danger : THEME.textDim}
              />
            ))}
          </View>
        </View>

        <Animated.View
          style={[
            styles.scorePill,
            { transform: [{ scale: scorePopAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] },
          ]}
        >
          <Ionicons name="star" size={13} color={THEME.warning} />
          <Text style={styles.scoreText}>{state.score.toLocaleString()}</Text>
        </Animated.View>
      </View>

      <View style={styles.subHeader}>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>{getTierName(state.level)}</Text>
        </View>
        {state.streak >= 3 && (
          <View style={styles.tierPill}>
            <Ionicons name="flame" size={11} color={THEME.warning} />
            <Text style={[styles.tierText, { color: THEME.warning }]}>{state.streak}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onHint}
          disabled={!canHint}
          activeOpacity={0.8}
          style={[styles.tierPill, !canHint && styles.pillOff]}
        >
          <Ionicons name="bulb" size={11} color={canHint ? THEME.warning : THEME.textDim} />
          <Text style={styles.tierText}>{state.hintsRemaining}</Text>
        </TouchableOpacity>
      </View>

      {mode === 'stroop' && (
        <View style={styles.wordArea}>
          {isShowing && showingIndex >= 0 && state.stroopSequence[showingIndex] && (
            <Text style={[styles.stroopWord, { color: hexFor(state.stroopSequence[showingIndex].ink.id) }]}>
              {state.stroopSequence[showingIndex].word.name}
            </Text>
          )}
        </View>
      )}

      <View style={styles.playArea}>
        {mode === 'stroop' ? (
          <SwipePad
            onSwipe={onSwipe}
            disabled={state.phase !== 'input' || isPaused}
            size={Math.min(SCREEN_WIDTH - 72, 260)}
            hintDirection={hintDirection}
          />
        ) : (
          <NodeBoard
            colors={state.palette}
            onPress={onColorPress}
            disabled={state.phase !== 'input' || isPaused}
            litId={currentStep?.color.id}
            hintedId={hintColor?.id}
            isShowing={isShowing}
            rotation={state.wheelRotation}
            centerLabel={centerLabel()}
            size={Math.min(SCREEN_WIDTH - 40, 330)}
          />
        )}

        {/* A decoy flash is marked as it happens — the skill is ignoring it, not guessing. */}
        {currentStep && !currentStep.real && (
          <View style={styles.fakeTag}>
            <Ionicons name="close" size={13} color={THEME.danger} />
            <Text style={styles.fakeText}>FAKE</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.progressDots}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < state.inputIndex && styles.dotDone,
                i === state.inputIndex && state.phase === 'input' && styles.dotCurrent,
              ]}
            />
          ))}
        </View>

        <View style={styles.timerTrack}>
          <View
            style={[
              styles.timerFill,
              {
                width: `${timerRatio * 100}%`,
                backgroundColor: timerRatio < 0.3 ? THEME.danger : THEME.cyan,
              },
            ]}
          />
        </View>
        <Text style={styles.timerText}>
          {state.phase === 'input' ? `${(timeLeft / 1000).toFixed(1)}s` : ' '}
        </Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.motivOverlay,
          {
            opacity: motivAnim,
            transform: [{ scale: motivAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          },
        ]}
      >
        <Text style={styles.motivText}>{motivText}</Text>
      </Animated.View>

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Ionicons name="pause-circle" size={50} color={THEME.cyan} />
            <Text style={styles.pauseTitle}>PAUSED</Text>
            {(state.phase === 'showing' || state.phase === 'ready') && (
              <Text style={styles.pauseNote}>The sequence replays when you resume</Text>
            )}
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => setIsPaused(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={17} color={THEME.bg} />
              <Text style={styles.resumeLabel}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={quitToMenu} activeOpacity={0.85}>
              <Text style={styles.quitLabel}>QUIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, paddingTop: 54 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: THEME.bgLight,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', gap: 6 },
  levelTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 2,
  },
  lives: { flexDirection: 'row', gap: 5 },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.bgLight,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
  },
  scoreText: { fontSize: 13, fontWeight: '800', color: THEME.warning },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.bgLight,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  pillOff: { opacity: 0.4 },
  tierText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.textDim,
    letterSpacing: 1.2,
  },
  wordArea: { height: 76, justifyContent: 'center', alignItems: 'center' },
  stroopWord: { fontSize: 42, fontWeight: '900', letterSpacing: 3 },
  playArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fakeTag: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.danger,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fakeText: { color: THEME.danger, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  footer: { alignItems: 'center', paddingBottom: 28, paddingHorizontal: 40, gap: 12 },
  progressDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.bgElevated,
  },
  dotDone: { backgroundColor: THEME.success },
  dotCurrent: { backgroundColor: THEME.cyan },
  timerTrack: {
    height: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: THEME.bgElevated,
    overflow: 'hidden',
  },
  timerFill: { height: 4, borderRadius: 2 },
  timerText: {
    color: THEME.textDim,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 17,
  },
  motivOverlay: { position: 'absolute', top: '44%', alignSelf: 'center' },
  motivText: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.warning,
    textAlign: 'center',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,6,13,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  pauseCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 3,
    marginTop: 10,
  },
  pauseNote: {
    fontSize: 12,
    color: THEME.textDim,
    textAlign: 'center',
    marginTop: 8,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: THEME.cyan,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 22,
  },
  resumeLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.bg,
    letterSpacing: 1.4,
  },
  quitButton: { alignSelf: 'stretch', paddingVertical: 13, marginTop: 6 },
  quitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDim,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});

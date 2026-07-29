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
  createInitialState,
  handleInput,
  advanceLevel,
  applyHint,
} from '../engine/gameEngine';
import { saveGameResult, getSettings, getHighScore, Achievement } from '../engine/storage';
import { ColorGrid } from '../components/ColorGrid';
import { SequenceDots } from '../components/SequenceDots';
import { SwipePad } from '../components/SwipePad';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HINT_VISIBLE_MS = 1400;

interface Props {
  mode: GameMode;
  onGameOver: (
    score: number,
    level: number,
    newAchievements: Achievement[],
    isNewRecord: boolean
  ) => void;
  onBack: () => void;
}

export function GameScreen({ mode, onGameOver, onBack }: Props) {
  const [state, setState] = useState<GameState>(() => createInitialState(mode));
  const [showingIndex, setShowingIndex] = useState(-1);
  const [motivText, setMotivText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [hintColor, setHintColor] = useState<GameColor | null>(null);
  const [settings, setSettings] = useState({ soundEnabled: true, hapticEnabled: true, showTutorial: true });

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const motivAnim = useRef(new Animated.Value(0)).current;

  // A run must only be recorded once, whether it ends by losing every life or
  // by the player quitting part way through.
  const savedRef = useRef(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const recordRun = useCallback(async (): Promise<{ achievements: Achievement[]; isNewRecord: boolean }> => {
    if (savedRef.current) return { achievements: [], isNewRecord: false };
    savedRef.current = true;
    // Read the old best first, otherwise the score just saved is always the best.
    const previousBest = await getHighScore(mode);
    const achievements = await saveGameResult(mode, state.score, state.level, state.bestStreak);
    return { achievements, isNewRecord: state.score > previousBest };
  }, [mode, state.score, state.level, state.bestStreak]);

  const quitToMenu = useCallback(async () => {
    // An abandoned run still counts — it is a game the player played.
    await recordRun();
    onBack();
  }, [recordRun, onBack]);

  useEffect(() => {
    if (isPaused) return;
    if (state.phase === 'ready') {
      const timer = setTimeout(() => {
        setState(s => ({ ...s, phase: 'showing' }));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.level, isPaused]);

  // Pausing tears this down and unpausing re-runs it, so the sequence replays
  // from the start rather than resuming mid-way through a half-seen pattern.
  useEffect(() => {
    if (isPaused || state.phase !== 'showing') return;

    const totalItems = mode === 'stroop' ? state.stroopSequence.length : state.sequence.length;
    let current = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    setShowingIndex(-1);

    const showNext = () => {
      if (current >= totalItems) {
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

  useEffect(() => {
    if (state.phase === 'success') {
      setHintColor(null);
      setMotivText(getMotivationalText(state.level, state.streak));
      Animated.sequence([
        Animated.timing(motivAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(motivAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setState(s => advanceLevel(s));
      });

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
        setTimeout(() => {
          setState(s => ({ ...s, phase: 'ready' }));
        }, 600);
      });

      if (settings.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  }, [state.phase === 'fail']);

  useEffect(() => {
    if (state.phase === 'gameover') {
      recordRun().then(({ achievements, isNewRecord }) => {
        setTimeout(() => {
          onGameOver(state.score, state.level, achievements, isNewRecord);
        }, 500);
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
    // The phase must be re-checked against the latest state, not the render
    // closure: two taps landing in the same frame would otherwise both pass a
    // stale "input" check, and the second would be judged against the position
    // the first already advanced past — a wrong answer, and a life lost, for
    // input the player never got wrong.
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
    if (settings.hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [state, isPaused, settings.hapticEnabled]);

  const isShowing = state.phase === 'showing' && !isPaused;
  const canHint = state.phase === 'input' && !isPaused && state.hintsRemaining > 0;
  const dotSequence = mode === 'stroop'
    ? state.stroopSequence.map(item => item.ink)
    : state.sequence;

  const hintDirection = hintColor
    ? STROOP_COLORS.find(c => c.id === hintColor.id)?.direction ?? null
    : null;

  const caption = () => {
    if (isPaused) return '';
    switch (state.phase) {
      case 'ready':   return getLevelMilestone(state.level) ?? 'GET READY';
      case 'showing': return 'MEMORIZE THE SEQUENCE';
      case 'input':   return mode === 'stroop' ? 'ANSWER THE COLOR, NOT THE WORD' : 'YOUR TURN';
      case 'fail':    return 'WRONG — TRY AGAIN';
      default:        return '';
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={quitToMenu} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.levelTitle}>LEVEL {state.level}</Text>

        {/* The swipe pad claims all four edges, so the hint control lives up here
            rather than under the board where it sat on the down arrow. */}
        <View style={[styles.headerSide, styles.headerRight]}>
          <TouchableOpacity
            onPress={onHint}
            disabled={!canHint}
            activeOpacity={0.8}
            style={[styles.iconButton, !canHint && styles.iconButtonOff]}
          >
            <Ionicons name="bulb" size={19} color={canHint ? THEME.warning : THEME.textDim} />
            {state.hintsRemaining > 0 && (
              <View style={styles.hintBadge}>
                <Text style={styles.hintBadgeText}>{state.hintsRemaining}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsPaused(true)}
            style={styles.iconButton}
            activeOpacity={0.7}
            disabled={state.phase === 'gameover'}
          >
            <Ionicons name="pause" size={20} color={THEME.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>{getTierName(state.level)}</Text>
        </View>
        <View style={styles.lives}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < state.lives ? 'heart' : 'heart-outline'}
              size={18}
              color={i < state.lives ? THEME.danger : THEME.textDim}
            />
          ))}
        </View>
        {state.streak >= 3 && (
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={13} color={THEME.warning} />
            <Text style={styles.streakText}>{state.streak}</Text>
          </View>
        )}
        <Animated.Text
          style={[
            styles.score,
            { transform: [{ scale: scorePopAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }] },
          ]}
        >
          {state.score.toLocaleString()}
        </Animated.Text>
      </View>

      <View style={styles.dotsWrap}>
        <SequenceDots
          sequence={dotSequence}
          filledCount={state.phase === 'input' ? state.inputIndex : 0}
        />
      </View>

      {mode === 'stroop' && (
        <View style={styles.wordArea}>
          {isShowing && showingIndex >= 0 && state.stroopSequence[showingIndex] && (
            <Text style={[styles.stroopWord, { color: state.stroopSequence[showingIndex].ink.hex }]}>
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
          <ColorGrid
            colors={state.palette}
            onPress={onColorPress}
            disabled={state.phase !== 'input' || isPaused}
            highlightedId={showingIndex >= 0 ? state.sequence[showingIndex]?.id : undefined}
            hintedId={hintColor?.id}
            isShowing={isShowing}
            width={Math.min(SCREEN_WIDTH - 48, 320)}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.caption}>{caption()}</Text>
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
            <Ionicons name="pause-circle" size={52} color={THEME.accent} />
            <Text style={styles.pauseTitle}>PAUSED</Text>
            {(state.phase === 'showing' || state.phase === 'ready') && (
              <Text style={styles.pauseNote}>The sequence replays when you resume</Text>
            )}

            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => setIsPaused(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color={THEME.text} />
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
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  headerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonOff: {
    opacity: 0.4,
  },
  hintBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: THEME.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.bg,
  },
  hintBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.bg,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 18,
  },
  tierPill: {
    backgroundColor: THEME.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.textDim,
    letterSpacing: 1.5,
  },
  lives: {
    flexDirection: 'row',
    gap: 4,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.bgLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakText: {
    color: THEME.warning,
    fontWeight: '800',
    fontSize: 12,
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
  },
  dotsWrap: {
    paddingTop: 18,
    minHeight: 34,
  },
  wordArea: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stroopWord: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 3,
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 34,
  },
  caption: {
    textAlign: 'center',
    color: THEME.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    minHeight: 16,
  },
  motivOverlay: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
  },
  motivText: {
    fontSize: 30,
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
    backgroundColor: 'rgba(10,10,15,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  pauseCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 22,
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
    backgroundColor: THEME.accent,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 22,
  },
  resumeLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1.2,
  },
  quitButton: {
    alignSelf: 'stretch',
    paddingVertical: 13,
    marginTop: 6,
  },
  quitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDim,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});

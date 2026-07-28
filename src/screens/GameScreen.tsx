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
import { getMotivationalText } from '../constants/levels';
import { COLOR_BY_DIRECTION, SwipeDirection } from '../constants/stroop';
import {
  GameState,
  GameMode,
  createInitialState,
  handleInput,
  advanceLevel,
} from '../engine/gameEngine';
import { saveGameResult, getSettings, getHighScore, Achievement } from '../engine/storage';
import { ColorGrid } from '../components/ColorGrid';
import { SequenceDots } from '../components/SequenceDots';
import { SwipePad } from '../components/SwipePad';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [settings, setSettings] = useState({ soundEnabled: true, hapticEnabled: true, showTutorial: true });

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const motivAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (state.phase === 'ready') {
      const timer = setTimeout(() => {
        setState(s => ({ ...s, phase: 'showing' }));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.level]);

  useEffect(() => {
    if (state.phase !== 'showing') return;

    const totalItems = mode === 'stroop' ? state.stroopSequence.length : state.sequence.length;
    let current = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];

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
        timers.push(setTimeout(showNext, 200));
      }, state.levelConfig.displayTime));
    };

    timers.push(setTimeout(showNext, 400));
    return () => timers.forEach(clearTimeout);
  }, [state.phase, state.level]);

  useEffect(() => {
    if (state.phase === 'success') {
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
      // Read the old best before saving, otherwise the just-saved score is the best.
      (async () => {
        const previousBest = await getHighScore(mode);
        const newAchievements = await saveGameResult(mode, state.score, state.level, state.bestStreak);
        setTimeout(() => {
          onGameOver(state.score, state.level, newAchievements, state.score > previousBest);
        }, 500);
      })();
      if (settings.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  }, [state.phase === 'gameover']);

  const onColorPress = useCallback((color: GameColor) => {
    if (state.phase !== 'input') return;

    if (settings.hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    setState(s => handleInput(s, color));
  }, [state.phase, settings.hapticEnabled]);

  const onSwipe = useCallback((direction: SwipeDirection) => {
    onColorPress(COLOR_BY_DIRECTION[direction]);
  }, [onColorPress]);

  const isShowing = state.phase === 'showing';
  const dotSequence = mode === 'stroop'
    ? state.stroopSequence.map(item => item.ink)
    : state.sequence;

  const caption = () => {
    switch (state.phase) {
      case 'ready':   return 'GET READY';
      case 'showing': return 'MEMORIZE THE SEQUENCE';
      case 'input':   return mode === 'stroop' ? 'SWIPE THE COLOR, NOT THE WORD' : 'YOUR TURN';
      case 'fail':    return 'WRONG — TRY AGAIN';
      default:        return '';
    }
  };

  const renderStroopWord = () => {
    const item = isShowing && showingIndex >= 0 ? state.stroopSequence[showingIndex] : null;
    return (
      <View style={styles.wordArea}>
        {item && (
          <Text style={[styles.stroopWord, { color: item.ink.hex }]}>{item.word.name}</Text>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.levelTitle}>LEVEL {state.level}</Text>
        <View style={styles.iconButton}>
          <Ionicons name="pause" size={20} color={THEME.text} />
        </View>
      </View>

      <View style={styles.statusRow}>
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

      {mode === 'stroop' && renderStroopWord()}

      <View style={styles.playArea}>
        {mode === 'stroop' ? (
          <SwipePad
            onSwipe={onSwipe}
            disabled={state.phase !== 'input'}
            size={Math.min(SCREEN_WIDTH - 72, 260)}
          />
        ) : (
          <ColorGrid
            colors={state.palette}
            onPress={onColorPress}
            disabled={state.phase !== 'input'}
            highlightedId={showingIndex >= 0 ? state.sequence[showingIndex]?.id : undefined}
            isShowing={isShowing}
            width={Math.min(SCREEN_WIDTH - 48, 320)}
          />
        )}
      </View>

      <Text style={styles.caption}>{caption()}</Text>

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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  caption: {
    textAlign: 'center',
    color: THEME.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingBottom: 34,
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
});

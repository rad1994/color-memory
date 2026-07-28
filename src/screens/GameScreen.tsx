import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { THEME, GameColor } from '../constants/colors';
import { getMotivationalText } from '../constants/levels';
import {
  GameState,
  GameMode,
  createInitialState,
  handleInput,
  advanceLevel,
} from '../engine/gameEngine';
import { saveGameResult, getSettings } from '../engine/storage';
import { ColorWheel } from '../components/ColorWheel';
import { Achievement } from '../engine/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  mode: GameMode;
  onGameOver: (score: number, level: number, newAchievements: Achievement[]) => void;
  onBack: () => void;
}

export function GameScreen({ mode, onGameOver, onBack }: Props) {
  const [state, setState] = useState<GameState>(() => createInitialState(mode));
  const [showingIndex, setShowingIndex] = useState(-1);
  const [motivText, setMotivText] = useState('');
  const [settings, setSettings] = useState({ soundEnabled: true, hapticEnabled: true, showTutorial: true });

  const fadeAnim = useRef(new Animated.Value(0)).current;
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
      setTimeout(() => {
        setShowingIndex(-1);
        setTimeout(showNext, 200);
      }, state.levelConfig.displayTime);
    };

    const startTimer = setTimeout(showNext, 400);
    return () => clearTimeout(startTimer);
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
      saveGameResult(mode, state.score, state.level, state.bestStreak).then(newAchievements => {
        setTimeout(() => {
          onGameOver(state.score, state.level, newAchievements);
        }, 500);
      });
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

  const getCurrentHighlight = (): string | undefined => {
    if (state.phase !== 'showing' || showingIndex < 0) return undefined;
    if (mode === 'stroop') {
      return state.stroopSequence[showingIndex]?.displayColor.id;
    }
    return state.sequence[showingIndex]?.id;
  };

  const renderSequenceDisplay = () => {
    if (state.phase === 'ready') {
      return (
        <View style={styles.displayArea}>
          <Text style={styles.levelText}>Level {state.level}</Text>
          <Text style={styles.readyText}>Get Ready!</Text>
        </View>
      );
    }

    if (state.phase === 'showing') {
      if (mode === 'stroop' && showingIndex >= 0 && state.stroopSequence[showingIndex]) {
        const item = state.stroopSequence[showingIndex];
        return (
          <View style={styles.displayArea}>
            <Text style={[styles.stroopEmoji, { color: item.displayColor.hex }]}>
              {item.object.emoji}
            </Text>
            <Text style={[styles.stroopLabel, { color: item.displayColor.hex }]}>
              {item.object.label}
            </Text>
          </View>
        );
      }
      if (showingIndex >= 0 && state.sequence[showingIndex]) {
        return (
          <View style={styles.displayArea}>
            <Animated.View
              style={[
                styles.colorDisplay,
                {
                  backgroundColor: state.sequence[showingIndex].hex,
                  shadowColor: state.sequence[showingIndex].hex,
                },
              ]}
            />
          </View>
        );
      }
      return (
        <View style={styles.displayArea}>
          <Text style={styles.readyText}>Watch...</Text>
        </View>
      );
    }

    if (state.phase === 'input') {
      const total = mode === 'stroop' ? state.stroopSequence.length : state.sequence.length;
      return (
        <View style={styles.displayArea}>
          <Text style={styles.inputPrompt}>Your Turn!</Text>
          <View style={styles.progressDots}>
            {Array.from({ length: total }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < state.inputIndex && styles.progressDotFilled,
                  i === state.inputIndex && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.levelLabel}>LVL {state.level}</Text>
          {state.streak >= 3 && (
            <Text style={styles.streakBadge}>🔥 {state.streak}</Text>
          )}
        </View>
        <View style={styles.scoreContainer}>
          <Animated.Text
            style={[
              styles.scoreText,
              {
                transform: [
                  { scale: scorePopAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
                ],
              },
            ]}
          >
            {state.score}
          </Animated.Text>
        </View>
      </View>

      <View style={styles.livesRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Text key={i} style={[styles.life, i >= state.lives && styles.lifeLost]}>
            {i < state.lives ? '❤️' : '🖤'}
          </Text>
        ))}
        {state.comboMultiplier > 1 && (
          <Text style={styles.comboText}>×{state.comboMultiplier}</Text>
        )}
      </View>

      {renderSequenceDisplay()}

      <Animated.View
        style={[
          styles.motivContainer,
          {
            opacity: motivAnim,
            transform: [
              { scale: motivAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
            ],
          },
        ]}
      >
        <Text style={styles.motivText}>{motivText}</Text>
      </Animated.View>

      <View style={styles.wheelContainer}>
        <ColorWheel
          colors={state.palette}
          rotation={state.wheelRotation}
          onPress={onColorPress}
          disabled={state.phase !== 'input'}
          highlightedId={getCurrentHighlight()}
          size={Math.min(SCREEN_WIDTH - 48, 320)}
        />
      </View>

      {mode === 'stroop' && state.phase === 'input' && (
        <Text style={styles.stroopHint}>
          Remember the DISPLAYED color, not the real one!
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: THEME.textDim,
    fontSize: 18,
    fontWeight: '700',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 2,
  },
  streakBadge: {
    fontSize: 14,
    color: THEME.warning,
    fontWeight: '700',
  },
  scoreContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.accent,
  },
  livesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  life: {
    fontSize: 22,
  },
  lifeLost: {
    opacity: 0.4,
  },
  comboText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.warning,
    marginLeft: 8,
  },
  displayArea: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 8,
  },
  readyText: {
    fontSize: 18,
    color: THEME.textDim,
    fontWeight: '500',
  },
  colorDisplay: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  inputPrompt: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressDotFilled: {
    backgroundColor: THEME.success,
    borderColor: THEME.success,
  },
  progressDotCurrent: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  stroopEmoji: {
    fontSize: 64,
  },
  stroopLabel: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  motivContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 10,
  },
  motivText: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.warning,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 195, 18, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stroopHint: {
    textAlign: 'center',
    color: THEME.textDim,
    fontSize: 12,
    paddingBottom: 24,
    fontStyle: 'italic',
  },
});

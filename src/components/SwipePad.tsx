import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable, Platform } from 'react-native';
import { THEME } from '../constants/colors';
import { STROOP_COLORS, SwipeDirection } from '../constants/stroop';
import { useTheme } from '../theme/ThemeContext';

const SWIPE_THRESHOLD = 30;

const KEY_TO_DIRECTION: Record<string, SwipeDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

interface Props {
  onSwipe: (direction: SwipeDirection) => void;
  disabled?: boolean;
  size: number;
  hintDirection?: SwipeDirection | null;
}

export function SwipePad({ onSwipe, disabled, size, hintDirection }: Props) {
  const [activeDirection, setActiveDirection] = useState<SwipeDirection | null>(null);
  const { hexFor } = useTheme();

  // The pan responder is created once, so it would otherwise close over the
  // first render's props forever. Refs keep it reading current values.
  const onSwipeRef = useRef(onSwipe);
  const disabledRef = useRef(disabled);
  onSwipeRef.current = onSwipe;
  disabledRef.current = disabled;

  const trigger = useCallback((direction: SwipeDirection) => {
    if (disabledRef.current) return;
    setActiveDirection(direction);
    setTimeout(() => setActiveDirection(null), 180);
    onSwipeRef.current(direction);
  }, []);

  // Swiping is meaningless with a mouse, so desktop gets the arrow keys.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      event.preventDefault();
      trigger(direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [trigger]);

  const responder = useRef(
    PanResponder.create({
      // Claiming the responder on touch start would swallow taps meant for the
      // badges, so only an actual drag becomes a swipe.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderRelease: (_, gesture) => {
        const { dx, dy } = gesture;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

        const direction: SwipeDirection =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'down' : 'up';

        trigger(direction);
      },
    })
  ).current;

  const badge = (direction: SwipeDirection, positionStyle: object) => {
    const color = STROOP_COLORS.find(c => c.direction === direction)!;
    const isActive = activeDirection === direction;
    const isHinted = hintDirection === direction;
    return (
      <Pressable
        onPress={() => trigger(direction)}
        disabled={disabled}
        style={[
          styles.badge,
          positionStyle,
          {
            backgroundColor: hexFor(color.id),
            opacity: disabled ? 0.35 : isActive || isHinted ? 1 : 0.9,
            transform: [{ scale: isActive || isHinted ? 1.22 : 1 }],
          },
          isHinted && styles.hinted,
        ]}
      >
        <Text style={styles.arrow}>{color.arrow}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.pad, { width: size, height: size }]} {...responder.panHandlers}>
      <Text style={styles.hint}>
        {disabled ? '' : Platform.OS === 'web' ? 'ARROW KEYS OR CLICK' : 'SWIPE OR TAP'}
      </Text>
      {badge('up', { top: 0, alignSelf: 'center' })}
      {badge('down', { bottom: 0, alignSelf: 'center' })}
      {badge('left', { left: 0, top: size / 2 - 26 })}
      {badge('right', { right: 0, top: size / 2 - 26 })}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  badge: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  arrow: {
    fontSize: 24,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.95)',
  },
  hinted: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  hint: {
    color: THEME.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { THEME } from '../constants/colors';
import { STROOP_COLORS, SwipeDirection } from '../constants/stroop';

const SWIPE_THRESHOLD = 30;

interface Props {
  onSwipe: (direction: SwipeDirection) => void;
  disabled?: boolean;
  size: number;
}

export function SwipePad({ onSwipe, disabled, size }: Props) {
  const [activeDirection, setActiveDirection] = useState<SwipeDirection | null>(null);

  // The pan responder is created once, so it would otherwise close over the
  // first render's props forever. Refs keep it reading current values.
  const onSwipeRef = useRef(onSwipe);
  const disabledRef = useRef(disabled);
  onSwipeRef.current = onSwipe;
  disabledRef.current = disabled;

  const flash = useCallback((direction: SwipeDirection) => {
    setActiveDirection(direction);
    setTimeout(() => setActiveDirection(null), 180);
  }, []);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderRelease: (_, gesture) => {
        if (disabledRef.current) return;
        const { dx, dy } = gesture;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

        const direction: SwipeDirection =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'down' : 'up';

        flash(direction);
        onSwipeRef.current(direction);
      },
    })
  ).current;

  const badge = (direction: SwipeDirection, positionStyle: object) => {
    const color = STROOP_COLORS.find(c => c.direction === direction)!;
    const isActive = activeDirection === direction;
    return (
      <View
        style={[
          styles.badge,
          positionStyle,
          {
            backgroundColor: color.hex,
            opacity: disabled ? 0.35 : isActive ? 1 : 0.85,
            transform: [{ scale: isActive ? 1.25 : 1 }],
          },
        ]}
      >
        <Text style={styles.arrow}>{color.arrow}</Text>
      </View>
    );
  };

  return (
    <View
      style={[styles.pad, { width: size, height: size }]}
      {...responder.panHandlers}
    >
      <View style={styles.centerHint}>
        <Text style={styles.hintText}>{disabled ? '' : 'swipe'}</Text>
      </View>
      {badge('up', { top: 0, alignSelf: 'center' })}
      {badge('down', { bottom: 0, alignSelf: 'center' })}
      {badge('left', { left: 0, top: size / 2 - 24 })}
      {badge('right', { right: 0, top: size / 2 - 24 })}
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  arrow: {
    fontSize: 22,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.95)',
  },
  centerHint: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    color: THEME.textDim,
    fontSize: 12,
    letterSpacing: 2,
  },
});

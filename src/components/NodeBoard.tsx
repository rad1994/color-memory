import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { GameColor, THEME } from '../constants/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  colors: GameColor[];
  onPress: (color: GameColor) => void;
  disabled?: boolean;
  /** Lit during playback, or flashing as a decoy. */
  litId?: string;
  /** Ringed white by a hint. */
  hintedId?: string;
  /** Dimmed while the sequence plays so the lit node stands out. */
  isShowing?: boolean;
  /** Degrees the ring is turned by — changes between levels once it unlocks. */
  rotation: number;
  centerLabel?: string;
  size: number;
}

export function NodeBoard({
  colors,
  onPress,
  disabled,
  litId,
  hintedId,
  isShowing,
  rotation,
  centerLabel,
  size,
}: Props) {
  const { hexFor } = useTheme();

  const nodeSize = colors.length > 6 ? 50 : 58;
  const radius = size / 2 - nodeSize / 2 - 10;

  // The ring turns as a whole so the movement reads as rotation. Positions are
  // laid out unrotated and the wrapper carries the angle, which keeps the
  // centre label upright instead of spinning with the board.
  const spin = useRef(new Animated.Value(rotation)).current;

  useEffect(() => {
    Animated.timing(spin, {
      toValue: rotation,
      duration: 750,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rotation]);

  const placed = colors.map((color, i) => {
    const angle = (i / colors.length) * 2 * Math.PI - Math.PI / 2;
    return {
      color,
      x: size / 2 + Math.cos(angle) * radius,
      y: size / 2 + Math.sin(angle) * radius,
    };
  });

  const spinStyle = {
    transform: [
      {
        rotate: spin.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.orbit, { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }]} />
      <View
        style={[
          styles.orbitInner,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            left: size * 0.2,
            top: size * 0.2,
          },
        ]}
      />

      <Animated.View style={[styles.ring, { width: size, height: size }, spinStyle]}>
        {placed.map((node, i) => {
          const next = placed[(i + 1) % placed.length];
          const dx = next.x - node.x;
          const dy = next.y - node.y;
          return (
            <View
              key={`link-${node.color.id}-${i}`}
              style={[
                styles.link,
                {
                  width: Math.hypot(dx, dy),
                  left: node.x,
                  top: node.y,
                  backgroundColor: hexFor(node.color.id, node.color.hex),
                  opacity: isShowing ? 0.18 : 0.32,
                  transform: [{ rotateZ: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg` }],
                },
              ]}
            />
          );
        })}

        {placed.map(node => (
          <Node
            key={node.color.id}
            color={node.color}
            hex={hexFor(node.color.id, node.color.hex)}
            size={nodeSize}
            left={node.x - nodeSize / 2}
            top={node.y - nodeSize / 2}
            lit={litId === node.color.id}
            hinted={hintedId === node.color.id}
            dimmed={isShowing && litId !== node.color.id}
            disabled={disabled}
            onPress={onPress}
          />
        ))}
      </Animated.View>

      {!!centerLabel && (
        <View
          pointerEvents="none"
          style={[
            styles.center,
            { left: size * 0.2, top: size * 0.2, width: size * 0.6, height: size * 0.6 },
          ]}
        >
          <Text style={styles.centerText}>{centerLabel}</Text>
        </View>
      )}
    </View>
  );
}

interface NodeProps {
  color: GameColor;
  hex: string;
  size: number;
  left: number;
  top: number;
  lit?: boolean;
  hinted?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  onPress: (color: GameColor) => void;
}

function Node({ color, hex, size, left, top, lit, hinted, dimmed, disabled, onPress }: NodeProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: lit ? 1 : 0,
      duration: lit ? 90 : 220,
      useNativeDriver: false,
    }).start();
  }, [lit]);

  const press = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 60 }).start();

  return (
    <Animated.View style={{ position: 'absolute', left, top, transform: [{ scale }] }}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 1.9,
            height: size * 1.9,
            borderRadius: size * 0.95,
            left: -size * 0.45,
            top: -size * 0.45,
            backgroundColor: hex,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
          },
        ]}
      />
      <Pressable
        onPress={() => onPress(color)}
        onPressIn={() => press(0.9)}
        onPressOut={() => press(1)}
        disabled={disabled}
        style={[
          styles.node,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: hex,
            borderColor: hinted ? '#FFFFFF' : hex,
            borderWidth: hinted ? 3 : 2,
            opacity: dimmed ? 0.3 : 1,
            shadowColor: hex,
            shadowOpacity: lit ? 1 : 0.7,
            shadowRadius: lit ? 22 : 10,
            elevation: lit ? 18 : 8,
          },
        ]}
      >
        <View style={[styles.core, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', left: 0, top: 0 },
  orbit: {
    position: 'absolute',
    left: 3,
    top: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orbitInner: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(120,150,255,0.10)',
  },
  link: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  centerText: {
    color: THEME.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textAlign: 'center',
    lineHeight: 18,
  },
  halo: { position: 'absolute' },
  node: { justifyContent: 'center', alignItems: 'center' },
  core: { backgroundColor: 'rgba(255,255,255,0.55)' },
});

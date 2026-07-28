import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GameColor } from '../constants/colors';
import { ColorButton } from './ColorButton';

interface Props {
  colors: GameColor[];
  rotation: number;
  onPress: (color: GameColor) => void;
  disabled?: boolean;
  highlightedId?: string;
  size?: number;
}

export function ColorWheel({
  colors,
  rotation,
  onPress,
  disabled,
  highlightedId,
  size = 280,
}: Props) {
  const buttonSize = Math.min(64, size / (colors.length > 5 ? 5 : 4));
  const radius = size / 2 - buttonSize / 2 - 8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size - 16,
            height: size - 16,
            borderRadius: (size - 16) / 2,
          },
        ]}
      />
      {colors.map((color, index) => {
        const angle = (index / colors.length) * 2 * Math.PI + (rotation * Math.PI) / 180;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <ColorButton
            key={color.id}
            color={color}
            size={buttonSize}
            onPress={onPress}
            disabled={disabled}
            highlighted={highlightedId === color.id}
            style={{
              position: 'absolute',
              left: size / 2 - buttonSize / 2 + x,
              top: size / 2 - buttonSize / 2 + y,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});

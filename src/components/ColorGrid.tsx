import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { GameColor } from '../constants/colors';

interface TileProps {
  color: GameColor;
  size: number;
  onPress: (color: GameColor) => void;
  disabled?: boolean;
  highlighted?: boolean;
  hinted?: boolean;
}

function ColorTile({ color, size, onPress, disabled, highlighted, hinted }: TileProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onPress(color)}
        onPressIn={() => animateTo(0.94)}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            backgroundColor: color.hex,
            // Dim unlit tiles while the sequence plays so the lit one reads clearly.
            opacity: highlighted === undefined ? 1 : highlighted ? 1 : 0.28,
            shadowColor: color.hex,
            shadowOpacity: highlighted ? 0.8 : 0,
            shadowRadius: highlighted ? 24 : 0,
            elevation: highlighted ? 16 : 0,
          },
          hinted && styles.hinted,
        ]}
      />
    </Animated.View>
  );
}

interface Props {
  colors: GameColor[];
  onPress: (color: GameColor) => void;
  disabled?: boolean;
  highlightedId?: string;
  hintedId?: string;
  isShowing?: boolean;
  width: number;
}

export function ColorGrid({
  colors,
  onPress,
  disabled,
  highlightedId,
  hintedId,
  isShowing,
  width,
}: Props) {
  const columns = colors.length <= 4 ? 2 : colors.length <= 6 ? 2 : 2;
  const rows = Math.ceil(colors.length / columns);
  const gap = 12;
  const tileSize = Math.min((width - gap * (columns - 1)) / columns, 150);

  return (
    <View style={[styles.grid, { width: tileSize * columns + gap * (columns - 1), gap }]}>
      {colors.map(color => (
        <ColorTile
          key={color.id}
          color={color}
          size={tileSize}
          onPress={onPress}
          disabled={disabled}
          highlighted={isShowing ? highlightedId === color.id : undefined}
          hinted={hintedId === color.id}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tile: {
    borderRadius: 18,
  },
  hinted: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});

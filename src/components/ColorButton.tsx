import React, { useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { GameColor } from '../constants/colors';

interface Props {
  color: GameColor;
  size: number;
  onPress: (color: GameColor) => void;
  disabled?: boolean;
  highlighted?: boolean;
  style?: ViewStyle;
}

export function ColorButton({ color, size, onPress, disabled, highlighted, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={() => onPress(color)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            backgroundColor: color.hex,
            borderRadius: size / 2,
            shadowColor: color.hex,
            shadowOpacity: highlighted ? 0.9 : 0.4,
            shadowRadius: highlighted ? 20 : 8,
            elevation: highlighted ? 12 : 4,
          },
        ]}
      >
        {highlighted && (
          <Animated.View
            style={[
              styles.glow,
              {
                width: size + 12,
                height: size + 12,
                borderRadius: (size + 12) / 2,
                borderColor: color.hex,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glow: {
    position: 'absolute',
    borderWidth: 3,
    opacity: 0.6,
  },
});

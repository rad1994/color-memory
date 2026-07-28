import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GameColor, THEME } from '../constants/colors';

interface Props {
  sequence: GameColor[];
  filledCount: number;
  revealColors?: boolean;
}

// The row of dots under the header in design/style-guide.png: entered steps take
// their color, the rest stay grey so the remaining length is always visible.
export function SequenceDots({ sequence, filledCount, revealColors = true }: Props) {
  return (
    <View style={styles.row}>
      {sequence.map((color, i) => {
        const isFilled = i < filledCount;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: isFilled && revealColors ? color.hex : THEME.bgElevated,
                transform: [{ scale: i === filledCount ? 1.15 : 1 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 20,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
});

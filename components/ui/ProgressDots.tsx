import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../constants/tokens';

interface ProgressDotsProps {
  // 1-based index of the current onboarding step.
  step: number;
  total: number;
  style?: ViewStyle;
}

// Shared progress-dot bar used across every onboarding screen. Reproduces the
// original inline dot pattern (active dot stretched to a pill, all preceding
// dots filled gold) so existing and new screens stay pixel-identical.
export default function ProgressDots({ step, total, style }: ProgressDotsProps) {
  const { theme } = useTheme();
  const active = step - 1;

  return (
    <View style={[styles.dots, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === active ? 22 : 7,
              backgroundColor: i <= active ? theme.gold : theme.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});

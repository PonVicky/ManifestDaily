import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { shadow, shadowDark } from '../../constants/tokens';
import Icon from './Icon';

interface StreakBadgeProps {
  value?: number;
}

export default function StreakBadge({ value }: StreakBadgeProps) {
  const { theme, darkMode } = useTheme();
  // Subscribe to sessions so the computed streak re-derives when a session is logged.
  useAppStore((s) => s.sessions);
  const streak = useAppStore((s) => s.streak)();
  const sh = darkMode ? shadowDark.sm : shadow.sm;

  const flameScale = useSharedValue(1);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600 }),
        withTiming(0.92, { duration: 400 }),
        withTiming(1.08, { duration: 500 }),
        withTiming(1, { duration: 300 }),
      ),
      -1,
      true,
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const count = value ?? streak;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          ...sh,
        },
      ]}
    >
      <Animated.View style={flameStyle}>
        <Icon name="target" size={20} color={theme.gold} fill={theme.gold} strokeWidth={1.7} />
      </Animated.View>
      <Text style={[styles.number, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
  },
  number: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
});

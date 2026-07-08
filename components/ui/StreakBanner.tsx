import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useAppStore, isStreakMilestone } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { shadow, shadowDark } from '../../constants/tokens';
import Icon from './Icon';

// How long the banner stays fully down before it slides back up on its own.
const HOLD_MS = 3200;

/**
 * A slim full-width banner that drops down from the very top of the screen on
 * the first app open of each day to celebrate the streak continuing. Driven by
 * the ephemeral `pendingStreakBanner` store field (set in `checkInToday`); it
 * animates in, holds briefly, animates out, then clears the field. Tap to
 * dismiss early. Mounted globally in app/_layout.tsx so it floats over any tab.
 */
export default function StreakBanner() {
  const { theme, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const streak = useAppStore((s) => s.pendingStreakBanner);
  const clearStreakBanner = useAppStore((s) => s.clearStreakBanner);
  const sh = darkMode ? shadowDark.md : shadow.md;

  const translateY = useSharedValue(-300);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Real measured card height, so the exit fully clears the top edge.
  const heightRef = useRef(160);

  const dismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const hidden = -(heightRef.current + insets.top + 40);
    opacity.value = withTiming(0, { duration: 240 });
    translateY.value = withTiming(hidden, { duration: 300 }, (finished) => {
      if (finished) runOnJS(clearStreakBanner)();
    });
  };

  useEffect(() => {
    if (streak == null) return;
    translateY.value = withTiming(0, { duration: 440 });
    opacity.value = withTiming(1, { duration: 320 });
    timerRef.current = setTimeout(dismiss, HOLD_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (streak == null) return null;

  const milestone = isStreakMilestone(streak);
  const title = milestone ? `🔥 ${streak}-day streak!` : `Day ${streak} streak`;
  const subtitle = milestone
    ? 'Incredible consistency — keep the fire going.'
    : 'You showed up today — keep the fire going.';

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, animStyle]}>
      <Pressable
        onPress={dismiss}
        onLayout={(e) => {
          heightRef.current = e.nativeEvent.layout.height;
        }}
        style={[
          styles.card,
          {
            paddingTop: insets.top + 12,
            backgroundColor: theme.card,
            borderColor: theme.border,
            ...sh,
          },
        ]}
      >
        <View style={[styles.flame, { backgroundColor: theme.goldSoft }]}>
          <Icon name="flame" size={22} color={theme.flame} fill={theme.flame} strokeWidth={1.6} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            {subtitle}
          </Text>
        </View>
        <Text style={[styles.count, { color: theme.gold, fontFamily: 'DMSans_500Medium' }]}>
          {streak}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  flame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 1,
  },
  count: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
});

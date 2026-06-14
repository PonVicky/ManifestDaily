import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize, shadow } from '../../constants/tokens';
import { GOALS, REMINDER_OPTIONS } from '../../constants/data';
import Button from '../../components/shared/Button';
import Icon, { IconName } from '../../components/ui/Icon';
import ProgressDots from '../../components/ui/ProgressDots';

const TOTAL_STEPS = 13;

function goalLabel(id?: string): string {
  return GOALS.find((g) => g.id === id)?.label ?? 'Confidence';
}

export default function PlanScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const name = useAppStore((s) => s.userName);
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const reminderTime = useAppStore((s) => s.reminderTime);

  const topGoal = goalLabel(selectedGoals[0]);
  const focusAreas = selectedGoals.length
    ? selectedGoals.map((id) => goalLabel(id)).join(', ')
    : topGoal;

  const reminder = REMINDER_OPTIONS.find((r) => r.id === reminderTime) ?? REMINDER_OPTIONS[0];

  const heading = name
    ? `Your ${topGoal} plan is ready, ${name}.`
    : `Your ${topGoal} plan is ready.`;

  const [trackW, setTrackW] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const progress = useSharedValue(0);

  const handleLoadComplete = () => {
    setIsLoaded(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    if (trackW > 0) {
      // Constant speed throughout, with a brief half-speed dip around 70% —
      // no stalling, and the start/end speeds match.
      progress.value = withDelay(
        300,
        withSequence(
          withTiming(0.7, { duration: 3500, easing: Easing.linear }),
          withTiming(0.78, { duration: 800, easing: Easing.linear }),
          withTiming(1, { duration: 1100, easing: Easing.linear }, (finished) => {
            if (finished) {
              runOnJS(handleLoadComplete)();
            }
          }),
        ),
      );
    }
  }, [trackW]);

  const fillStyle = useAnimatedStyle(() => ({
    width: progress.value * trackW,
  }));

  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'clock', label: 'Daily affirmation time', value: `${reminder.label} · ${reminder.time}` },
    { icon: 'sparkle', label: 'Focus area', value: focusAreas },
    { icon: 'flame', label: 'Streak goal', value: '21 days to feel the shift' },
  ];

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <LinearGradient
        colors={[theme.accentTint, 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={11} total={TOTAL_STEPS} />

        <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
          {heading}
        </Text>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, shadow.md]}>
            {rows.map((r, i) => (
              <View
                key={r.label}
                style={[
                  styles.planRow,
                  i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.accentTint }]}>
                  <Icon name={r.icon} size={18} color={theme.gold} />
                </View>
                <View style={styles.planRowText}>
                  <Text style={[styles.rowLabel, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                    {r.label}
                  </Text>
                  <Text style={[styles.rowValue, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                    {r.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.progressWrap}>
            <Text style={[styles.progressLabel, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
              Building your practice...
            </Text>
            <View
              style={[styles.track, { backgroundColor: theme.bg2 }]}
              onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            >
              <Animated.View style={[styles.fill, { backgroundColor: theme.orange }, fillStyle]} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="See my full plan"
            onPress={() => router.push('/(onboarding)/paywall')}
            variant="primary"
            disabled={!isLoaded}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 30,
    letterSpacing: -0.3,
    lineHeight: 40,
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  card: {
    borderRadius: radius['4xl'],
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.lg,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSize.sm,
  },
  rowValue: {
    fontSize: fontSize.lg,
    lineHeight: 22,
  },
  progressWrap: {
    gap: spacing.md,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingTop: spacing.base,
  },
});

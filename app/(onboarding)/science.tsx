import React, { useEffect } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import ProgressDots from '../../components/ui/ProgressDots';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;

interface Fact {
  emoji: string;
  text: string;
  source: string;
}

const FACTS: Fact[] = [
  { emoji: '🧠', text: "Affirmations activate the brain's reward system", source: 'Neuroscience' },
  { emoji: '📅', text: '21 days to build a new thought pattern', source: 'Habit research' },
  { emoji: '✨', text: '5 minutes a day is all it takes', source: 'Based on user data' },
];

function FactRow({ item, index }: { item: Fact; index: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = 250 + index * 320;
    opacity.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 520, easing: Easing.out(Easing.ease) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }, style]}>
      <View style={[styles.iconBox, { backgroundColor: theme.accentTint }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
          {item.text}
        </Text>
        <Text style={[styles.rowSource, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
          {item.source}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ScienceScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={9} total={TOTAL_STEPS} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
            This actually works.
          </Text>

          <View style={styles.rows}>
            {FACTS.map((f, i) => (
              <FactRow key={f.text} item={f} index={i} />
            ))}
          </View>

          <Text style={[styles.footnote, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            ManifestDaily is built on these principles.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={() => {
              trackEvent('onboarding_step_completed', { step: 9 });
              router.push('/(onboarding)/affirmation');
            }}
            variant="primary"
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 30,
    letterSpacing: -0.3,
    lineHeight: 38,
    marginBottom: spacing.xl,
  },
  rows: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    padding: spacing.base,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: fontSize.lg,
    lineHeight: 22,
  },
  rowSource: {
    fontSize: fontSize.sm,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  footnote: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    paddingTop: spacing.base,
  },
});

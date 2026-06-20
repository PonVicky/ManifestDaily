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
import { spacing, radius, fontSize, shadow } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import ProgressDots from '../../components/ui/ProgressDots';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;

interface Testimonial {
  initials: string;
  name: string;
  since: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    initials: 'SR',
    name: 'Sofia R.',
    since: '2023',
    quote: 'I open it every morning before anything else. It changed how I talk to myself.',
  },
  {
    initials: 'MV',
    name: 'Marcus V.',
    since: '2024',
    quote: "Three weeks in and I finally believe the words I'm reading. Quietly life-changing.",
  },
  {
    initials: 'AL',
    name: 'Amara L.',
    since: '2022',
    quote: 'The calmest five minutes of my day. I feel more like myself again.',
  },
];

function Stars({ color }: { color: string }) {
  return <Text style={[styles.stars, { color }]}>★★★★★</Text>;
}

function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    const delay = 200 + index * 160;
    opacity.value = withDelay(delay, withTiming(1, { duration: 480, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 480, easing: Easing.out(Easing.ease) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, shadow.sm, style]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.accentTint }]}>
          <Text style={[styles.avatarText, { color: theme.gold, fontFamily: 'DMSans_500Medium' }]}>
            {item.initials}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardName, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
            {item.name}
          </Text>
          <Text style={[styles.cardSince, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            manifesting since {item.since}
          </Text>
        </View>
        <Stars color={theme.gold} />
      </View>
      <Text style={[styles.quote, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
        “{item.quote}”
      </Text>
    </Animated.View>
  );
}

export default function SocialScreen() {
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
        <ProgressDots step={8} total={TOTAL_STEPS} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
            You're in good company.
          </Text>

          <View style={styles.cards}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} item={t} index={i} />
            ))}
          </View>

          <Text style={[styles.proof, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
            Join a growing community of manifestors.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={() => {
              trackEvent('onboarding_step_completed', { step: 8 });
              router.push('/(onboarding)/science');
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
  cards: {
    gap: spacing.base,
  },
  card: {
    borderRadius: radius['3xl'],
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.base,
    letterSpacing: 0.3,
  },
  cardMeta: {
    flex: 1,
    gap: 1,
  },
  cardName: {
    fontSize: fontSize.md,
  },
  cardSince: {
    fontSize: fontSize.xs,
  },
  stars: {
    fontSize: 12,
    letterSpacing: 1,
  },
  quote: {
    fontSize: fontSize.lg,
    lineHeight: 24,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  proof: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    paddingTop: spacing.base,
  },
});

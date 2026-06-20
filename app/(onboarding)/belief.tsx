import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { spacing, fontSize } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import Mascot from '../../components/ui/Mascot';
import ProgressDots from '../../components/ui/ProgressDots';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;
const BELIEF_BUTTON = '#E0B98F';
const BELIEF_CAPTION = '#4E443B';

const QUOTE =
  "The life you're imagining... already exists. You're just learning to walk toward it.";
const WORDS = QUOTE.split(' ');
const WORD_STEP = 220; // ms between each word fading in
const WORDS_START_DELAY = 300; // ms before the first word fades in
// Total time for the whole quote to finish revealing, used to gate the button.
const WORDS_DONE_DELAY = WORDS_START_DELAY + (WORDS.length - 1) * WORD_STEP + 450;

// A single word that fades + drifts up on a staggered delay.
function AnimatedWord({ word, index, color }: { word: string; index: number; color: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = WORDS_START_DELAY + index * WORD_STEP;
    opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 450 }));

    const hapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, delay);

    return () => clearTimeout(hapticTimer);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text
      style={[styles.quoteWord, { color, fontFamily: 'DMSerifDisplay_400Regular_Italic' }, style]}
    >
      {word + ' '}
    </Animated.Text>
  );
}

// A slow-pulsing decorative dot in the background.
function GlowDot({ left, top, size, delay, color }: {
  left: string; top: string; size: number; delay: number; color: string;
}) {
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.12, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: left as any,
          top: top as any,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const DOTS = [
  { left: '12%', top: '18%', size: 10, delay: 0 },
  { left: '82%', top: '24%', size: 7, delay: 600 },
  { left: '24%', top: '70%', size: 6, delay: 1200 },
  { left: '74%', top: '66%', size: 11, delay: 400 },
  { left: '50%', top: '12%', size: 5, delay: 900 },
  { left: '88%', top: '54%', size: 6, delay: 1500 },
];

export default function BeliefScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [buttonReady, setButtonReady] = useState(false);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(12);

  useEffect(() => {
    buttonOpacity.value = withDelay(WORDS_DONE_DELAY, withTiming(1, { duration: 400 }));
    buttonTranslateY.value = withDelay(WORDS_DONE_DELAY, withTiming(0, { duration: 400 }));

    const readyTimer = setTimeout(() => setButtonReady(true), WORDS_DONE_DELAY);
    return () => clearTimeout(readyTimer);
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg1.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <LinearGradient
        colors={[theme.accentTint, 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {DOTS.map((d, i) => (
        <GlowDot key={i} {...d} color={theme.gold} />
      ))}

      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={5} total={TOTAL_STEPS} />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Mascot state="meditate" size={104} float halo />

          <View style={styles.quoteWrap}>
            {WORDS.map((w, i) => (
              <AnimatedWord key={i} word={w} index={i} color={theme.text} />
            ))}
          </View>

          <Text style={[styles.caption, { color: BELIEF_CAPTION, fontFamily: 'DMSans_400Regular' }]}>
            ManifestDaily turns that vision into your daily reality.
          </Text>
        </ScrollView>

        <Animated.View style={[styles.footer, buttonStyle]}>
          <Button
            label="I'm ready"
            onPress={() => {
              trackEvent('onboarding_step_completed', { step: 5 });
              router.push('/(onboarding)/reminder');
            }}
            variant="primary"
            disabled={!buttonReady}
            style={{
              backgroundColor: BELIEF_BUTTON,
              borderWidth: 1,
              borderColor: '#C99D73',
              shadowColor: BELIEF_BUTTON,
            }}
          />
        </Animated.View>
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
    height: '60%',
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingVertical: spacing.xl,
  },
  quoteWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 340,
  },
  quoteWord: {
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
  },
  caption: {
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    paddingTop: spacing.base,
  },
});

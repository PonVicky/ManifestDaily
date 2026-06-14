import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, fontSize } from '../../constants/tokens';
import { AFFIRMATIONS } from '../../constants/data';
import Button from '../../components/shared/Button';
import ProgressDots from '../../components/ui/ProgressDots';

const TOTAL_STEPS = 13;
const WORD_STEP = 220; // ms between each word fading in
const WORDS_START_DELAY = 400; // ms before the first word fades in

// A single word that fades + drifts up on a staggered delay, ticking a haptic as it appears.
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
      style={[styles.affirmationWord, { color, fontFamily: 'DMSerifDisplay_400Regular_Italic' }, style]}
    >
      {word + ' '}
    </Animated.Text>
  );
}

export default function AffirmationScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const insets = useSafeAreaInsets();

  const goalId = selectedGoals[0] ?? 'confidence';
  const affirmationText = AFFIRMATIONS[goalId][0];

  const words = affirmationText.split(' ');
  const displayWords = words.map((w, i) => {
    if (words.length === 1) return `"${w}"`;
    if (i === 0) return `"${w}`;
    if (i === words.length - 1) return `${w}"`;
    return w;
  });

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);

  const hintOpacity = useSharedValue(0);
  const hintTranslateY = useSharedValue(16);

  const [buttonReady, setButtonReady] = useState(false);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(12);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: 500 }));

    const wordsDoneDelay = WORDS_START_DELAY + (words.length - 1) * WORD_STEP + 450;

    const hintDelay = WORDS_START_DELAY + words.length * WORD_STEP + 200;
    hintOpacity.value = withDelay(hintDelay, withTiming(1, { duration: 500 }));
    hintTranslateY.value = withDelay(hintDelay, withTiming(0, { duration: 500 }));

    buttonOpacity.value = withDelay(wordsDoneDelay, withTiming(1, { duration: 400 }));
    buttonTranslateY.value = withDelay(wordsDoneDelay, withTiming(0, { duration: 400 }));

    const readyTimer = setTimeout(() => setButtonReady(true), wordsDoneDelay);
    return () => clearTimeout(readyTimer);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateY: hintTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      {/* Glow behind affirmation */}
      <LinearGradient
        colors={[theme.accentTint, 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={10} total={TOTAL_STEPS} />

        <View style={styles.content}>
          <View style={styles.affirmationArea}>
            <Animated.View style={[styles.headerGroup, headerStyle]}>
              <Text
                style={[styles.label, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
              >
                YOUR FIRST AFFIRMATION
              </Text>

              {/* Decorative dots */}
              <View style={styles.accentDots}>
                <View style={[styles.accentDot, { backgroundColor: theme.gold }]} />
                <View style={[styles.accentDot, { backgroundColor: theme.goldSoft }]} />
                <View style={[styles.accentDot, { backgroundColor: theme.border }]} />
              </View>
            </Animated.View>

            <View style={styles.quoteWrap}>
              {displayWords.map((w, i) => (
                <AnimatedWord key={i} word={w} index={i} color={theme.text} />
              ))}
            </View>

            <Animated.Text
              style={[styles.hint, { color: theme.text2, fontFamily: 'DMSans_300Light' }, hintStyle]}
            >
              Read it slowly. Believe it.
            </Animated.Text>
          </View>
        </View>

        <Animated.View style={buttonStyle}>
          <Button
            label="This feels right"
            onPress={() => router.push('/(onboarding)/plan')}
            variant="primary"
            disabled={!buttonReady}
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
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: { height: 7, borderRadius: 4 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affirmationArea: {
    alignItems: 'center',
    gap: spacing.xl,
    maxWidth: 340,
  },
  headerGroup: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  label: {
    fontSize: 12,
    letterSpacing: 2.5,
  },
  accentDots: {
    flexDirection: 'row',
    gap: 6,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  quoteWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  affirmationWord: {
    fontSize: 33,
    lineHeight: 42,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: fontSize.md,
    letterSpacing: 0.3,
  },
});

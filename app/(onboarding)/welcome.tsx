import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import Mascot from '../../components/ui/Mascot';
import ProgressDots from '../../components/ui/ProgressDots';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;
const BACKGROUND_TEXT = '#2D211A';
const DAILY_GOLD = '#D4A679';
const BACKGROUND_MUTED = '#594033';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    trackEvent('onboarding_started');
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(200, withTiming(0, { duration: 600 }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      {/* Radial halo gradient */}
      <LinearGradient
        colors={[theme.accentTint, 'transparent']}
        style={styles.haloGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Dots indicator */}
        <ProgressDots step={1} total={TOTAL_STEPS} style={{ marginBottom: spacing['2xl'] }} />

        {/* Mascot */}
        <View style={styles.mascotArea}>
          <View style={styles.mascotBackdrop}>
            <Mascot state="meditate" size={158} float />
          </View>
        </View>

        <Animated.View style={[styles.textArea, contentStyle]}>
          <Text style={[styles.appName, { color: BACKGROUND_TEXT, fontFamily: 'DMSerifDisplay_400Regular' }]}>
            Manifest<Text style={{ color: DAILY_GOLD }}>Daily</Text>
          </Text>
          <Text style={[styles.tagline, { color: BACKGROUND_MUTED, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
            Affirm the life you imagine
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonArea, contentStyle]}>
          <Button
            label="Get started"
            onPress={() => {
              trackEvent('onboarding_step_completed', { step: 1 });
              router.push('/(onboarding)/name');
            }}
            variant="primary"
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  haloGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  mascotArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotBackdrop: {
    width: 224,
    height: 224,
    borderRadius: 112,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(225, 190, 157, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(188, 143, 108, 0.16)',
    shadowColor: '#4A2B1D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
  textArea: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  appName: {
    fontSize: 42,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 21,
    color: '#7A6B5D',
    textAlign: 'center',
  },
  buttonArea: {
    width: '100%',
    gap: spacing.base,
  },
});

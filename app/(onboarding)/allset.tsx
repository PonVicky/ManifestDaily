import React, { useEffect } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, fontSize } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import ProgressDots from '../../components/ui/ProgressDots';

const TOTAL_STEPS = 13;

export default function AllSetScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const name = useAppStore((s) => s.userName);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(200, withTiming(0, { duration: 600 }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleEnter = () => {
    completeOnboarding();
    router.replace('/(tabs)/');
  };

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
        <ProgressDots step={13} total={TOTAL_STEPS} />

        <View style={styles.content}>
          <Image source={require('../../assets/mascot-side.png')} style={styles.mascot} />

          <Animated.View style={[styles.textArea, contentStyle]}>
            <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
              {name ? `You're all set, ${name}` : "You're all set"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
              Your daily practice begins now.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, contentStyle]}>
          <Button label="Enter ManifestDaily" onPress={handleEnter} variant="primary" />
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
    height: 400,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // gap: spacing['2xl'],
  },
  mascot: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  textArea: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 34,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    paddingTop: spacing.base,
  },
});

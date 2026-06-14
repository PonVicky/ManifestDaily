import React, { useEffect } from 'react';
import { ImageBackground, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, shadow, shadowDark } from '../constants/tokens';
import { GOALS, goalIdForAffirmation } from '../constants/data';
import Icon from '../components/ui/Icon';

// Fixed tones for text over the photo background — theme.gold doesn't have
// enough contrast against the photo. bg5_lite (bright) needs dark text,
// bg5_dark (moody/night) needs light text.
const PHOTO_TEXT_LIGHT = '#4A3829';
const PHOTO_ACCENT_LIGHT = '#8B5E3C';
const PHOTO_TEXT_DARK = '#F5EDE0';
const PHOTO_ACCENT_DARK = '#E0BB8C';

// Minimum horizontal drag (px) before a swipe counts as a page change.
const SWIPE_THRESHOLD = 50;

// Full-screen, premium "moment" for a single affirmation. Opened as a modal
// (slide_from_bottom) when the user taps the affirmation card on Home.
export default function AffirmationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, darkMode } = useTheme();

  const fadeAnim = useSharedValue(1);

  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const toggleSaveAffirmation = useAppStore((s) => s.toggleSaveAffirmation);
  const currentAffirmation = useAppStore((s) => s.currentAffirmation);
  const nextAffirmation = useAppStore((s) => s.nextAffirmation);
  const prevAffirmation = useAppStore((s) => s.prevAffirmation);
  // Subscribe to the slices `currentAffirmation()` reads from, so the screen
  // re-renders (and recomputes its text) when the affirmation changes.
  useAppStore((s) => s.affirmationIndex);
  // Re-render when goal selection changes (currentAffirmation pools all goals).
  useAppStore((s) => s.selectedGoals);
  const text = currentAffirmation();
  const isSaved = savedAffirmations.includes(text);
  // Tag reflects the goal of the CURRENT affirmation (goals may be pooled).
  const tagGoalId = goalIdForAffirmation(text);
  const goal = tagGoalId ? GOALS.find((g) => g.id === tagGoalId) : undefined;
  const sh = darkMode ? shadowDark.md : shadow.md;
  const photoText = darkMode ? PHOTO_TEXT_DARK : PHOTO_TEXT_LIGHT;
  const photoAccent = darkMode ? PHOTO_ACCENT_DARK : PHOTO_ACCENT_LIGHT;

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const triggerFadeAnimation = () => {
    fadeAnim.value = withTiming(1, { duration: 400 });
  };

  useEffect(() => {
    fadeAnim.value = 0;
    triggerFadeAnimation();
  }, [text]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveAffirmation(text);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${text}\n\n— ManifestDaily` });
    } catch {
      // User dismissed the share sheet, or sharing is unavailable — ignore.
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextAffirmation();
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    prevAffirmation();
  };

  // Swipe left → next affirmation, swipe right → previous.
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleNext)();
      } else if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handlePrev)();
      }
    });

  return (
    <ImageBackground
      source={darkMode ? require('../assets/bg5_dark.webp') : require('../assets/bg5_lite.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <GestureDetector gesture={swipeGesture}>
        <View
          style={[
            styles.inner,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          {/* Close (top-left) */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
            activeOpacity={0.75}
          >
            <Icon name="close" size={18} color={theme.text2} strokeWidth={2} />
          </TouchableOpacity>

          {/* The affirmation — the centerpiece */}
          <View style={styles.center}>
            {/* Fixed frosted glass panel so the text stays readable over the photo */}
            <Animated.View style={animatedCardStyle}>
              <BlurView
                intensity={45}
                tint={darkMode ? 'dark' : 'light'}
                style={[styles.frostedCard, darkMode ? styles.frostedCardDark : styles.frostedCardLight, sh]}
              >
                <Text
                  style={[
                    styles.affirmation,
                    { color: photoText, fontFamily: 'DMSerifDisplay_400Regular_Italic' },
                  ]}
                >
                  {text}
                </Text>

                {goal && (
                  <Text style={[styles.goalTag, { color: photoAccent, fontFamily: 'DMSans_500Medium' }]}>
                    ✦ {goal.label}
                  </Text>
                )}
              </BlurView>
            </Animated.View>
          </View>

          {/* Footer: actions */}
          <View style={styles.footer}>
            <View style={styles.actions}>
              {/* Previous */}
              <TouchableOpacity
                onPress={handlePrev}
                style={[styles.actionBtn, styles.navBtn, { backgroundColor: theme.gold, ...sh }]}
                activeOpacity={0.9}
              >
                <Icon name="arrowL" size={22} color={theme.onAccent} />
              </TouchableOpacity>

              {/* Save / heart */}
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.actionBtn,
                  {
                    borderColor: isSaved ? theme.gold : theme.border,
                    backgroundColor: isSaved ? theme.sel : theme.cardSolid,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Icon
                  name="heart"
                  size={22}
                  color={isSaved ? theme.gold : theme.text2}
                  fill={isSaved ? theme.gold : 'none'}
                />
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.cardSolid }]}
                activeOpacity={0.85}
              >
                <Icon name="share" size={22} color={theme.text2} />
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.actionBtn, styles.navBtn, { backgroundColor: theme.gold, ...sh }]}
                activeOpacity={0.9}
              >
                <Icon name="arrowR" size={22} color={theme.onAccent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GestureDetector>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  frostedCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: radius['4xl'],
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  frostedCardLight: {
    backgroundColor: 'rgba(255, 252, 245, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  frostedCardDark: {
    backgroundColor: 'rgba(20, 16, 13, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  affirmation: {
    fontSize: 30,
    lineHeight: 42,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  goalTag: {
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    borderWidth: 0,
  },
});

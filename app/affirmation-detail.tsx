import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { useAffirmationShare } from '../hooks/useAffirmationShare';
import { spacing, radius, fontSize, shadow, shadowDark } from '../constants/tokens';
import { GOALS } from '../constants/data';
import { homeAffirmationFor } from '../constants/homeAffirmations';
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
  const { shareCard, share, isSharing } = useAffirmationShare();

  const fadeAnim = useSharedValue(1);

  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const toggleSaveAffirmation = useAppStore((s) => s.toggleSaveAffirmation);

  // Opened from the Home card, so it opens on TODAY's curated affirmation.
  // The arrows/swipes browse the same 30 from there via a local offset —
  // local, not persisted, so leaving and reopening always returns to today
  // rather than stranding the user wherever they last browsed to.
  const [offset, setOffset] = useState(0);
  const current = homeAffirmationFor(offset);
  const text = current.text;
  const isSaved = savedAffirmations.includes(text);
  const tagGoalId = current.category;
  const goal = GOALS.find((g) => g.id === tagGoalId);
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

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    share(text, tagGoalId);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOffset((o) => o + 1);
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOffset((o) => o - 1);
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
                disabled={isSharing}
                style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.cardSolid }]}
                activeOpacity={0.85}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={theme.text2} />
                ) : (
                  <Icon name="share" size={22} color={theme.text2} />
                )}
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

      {shareCard}
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

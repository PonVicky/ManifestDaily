import React, { useEffect } from 'react';
import { ImageBackground, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { radius, shadow, shadowDark, spacing } from '../../constants/tokens';
import { GOALS, goalIdForAffirmation } from '../../constants/data';
import { trackEvent } from '../../lib/analytics';
import Icon from './Icon';

const CARD_BG_LITE = require('../../assets/bg_card_lite.webp');
const CARD_BG_DARK = require('../../assets/bg_card_dark.png');

interface AffirmationCardProps {
  onSwap?: () => void;
}

export default function AffirmationCard(_props: AffirmationCardProps) {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const toggleSaveAffirmation = useAppStore((s) => s.toggleSaveAffirmation);
  const currentAffirmation = useAppStore((s) => s.currentAffirmation);
  useAppStore((s) => s.affirmationIndex);
  useAppStore((s) => s.selectedGoals);
  const sh = darkMode ? shadowDark.lg : shadow.lg;

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const text = currentAffirmation();
  const isSaved = savedAffirmations.includes(text);

  // Fire once per distinct affirmation shown on the home card (initial display
  // and whenever the rotating affirmation changes).
  useEffect(() => {
    trackEvent('affirmation_viewed');
  }, [text]);

  const goalId = goalIdForAffirmation(text);
  const goal = goalId ? GOALS.find((g) => g.id === goalId) : undefined;

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/affirmations');
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleSaveAffirmation(text);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${text}"\n\n— ManifestDaily\nDaily affirmations & focus sessions`,
      });
    } catch { }
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={handleOpen} activeOpacity={0.95}>
      <Animated.View style={[styles.cardWrapper, { borderColor: theme.border, ...sh }, cardStyle]}>
        <ImageBackground
          source={darkMode ? CARD_BG_DARK : CARD_BG_LITE}
          style={styles.card}
          imageStyle={styles.cardBgImage}
          resizeMode="cover"
        >


          {/* Personalized goal tag */}
          {goal && (
            <Text style={[styles.goalTag, { color: theme.gold, fontFamily: 'DMSans_500Medium' }]}>
              ✦ {goal.label}
            </Text>
          )}

          {/* Label */}
          <Text style={[styles.label, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            TODAY'S AFFIRMATION
          </Text>

          {/* Affirmation text */}
          <Text style={[styles.affirmationText, { color: theme.gold, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
            {text}
          </Text>

          {/* Action pills */}
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.pill, { borderColor: isSaved ? theme.gold : theme.border, backgroundColor: isSaved ? theme.sel : theme.cardSolid }]}
              onPress={handleSave}
            >
              <Icon name="heart" size={18} color={isSaved ? theme.gold : theme.text2} fill={isSaved ? theme.gold : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, { borderColor: theme.border, backgroundColor: theme.cardSolid }]}
              onPress={handleShare}
            >
              <Icon name="share" size={18} color={theme.text2} />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: radius['5xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    padding: 28,
    paddingTop: 22,
  },
  goalTag: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  affirmationText: {
    fontSize: 27,
    lineHeight: 36,
    letterSpacing: -0.3,
    marginBottom: spacing.xl,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBgImage: {
    left: -40,
    right: -20,
  },
});

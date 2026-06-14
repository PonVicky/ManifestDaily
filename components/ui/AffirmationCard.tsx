import React, { useEffect, useRef } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { radius, shadow, shadowDark, spacing, fontSize } from '../../constants/tokens';
import { GOALS, goalIdForAffirmation } from '../../constants/data';
import Icon from './Icon';

interface AffirmationCardProps {
  onSwap?: () => void;
}

export default function AffirmationCard(_props: AffirmationCardProps) {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const toggleSaveAffirmation = useAppStore((s) => s.toggleSaveAffirmation);
  const currentAffirmation = useAppStore((s) => s.currentAffirmation);
  // Subscribe to the slices `currentAffirmation()` reads from, so the card
  // re-renders (and recomputes its text) when the affirmation changes.
  useAppStore((s) => s.affirmationIndex);
  // Re-render when goal selection changes (currentAffirmation pools all goals).
  useAppStore((s) => s.selectedGoals);
  const sh = darkMode ? shadowDark.lg : shadow.lg;

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const text = currentAffirmation();
  const isSaved = savedAffirmations.includes(text);

  // Goal tag reflects the goal of the CURRENT affirmation (goals may be pooled).
  const goalId = goalIdForAffirmation(text);
  const goal = goalId ? GOALS.find((g) => g.id === goalId) : undefined;

  // Tapping the card opens the full-screen affirmation moment (modal).
  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/affirmation-detail');
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
    } catch {
      // User dismissed the share sheet, or sharing is unavailable — ignore.
    }
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={handleOpen} activeOpacity={0.95}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            ...sh,
          },
          cardStyle,
        ]}
      >
        {/* Opaque warm gradient fill (sits over the illustrated background) */}
        <LinearGradient
          colors={[theme.sel, theme.card]}
          locations={[0, 0.55]}
          start={{ x: 0.4, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Decorative quote mark */}
        <Text
          style={[
            styles.quoteMark,
            { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' },
          ]}
        >
          "
        </Text>

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
        <Text
          style={[
            styles.affirmationText,
            { color: theme.gold, fontFamily: 'DMSerifDisplay_400Regular_Italic' },
          ]}
        >
          {text}
        </Text>

        {/* Action pills */}
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                borderColor: isSaved ? theme.gold : theme.border,
                backgroundColor: isSaved ? theme.sel : theme.cardSolid,
              },
            ]}
            onPress={handleSave}
          >
            <Icon
              name="heart"
              size={18}
              color={isSaved ? theme.gold : theme.text2}
              fill={isSaved ? theme.gold : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, { borderColor: theme.border, backgroundColor: theme.cardSolid }]}
            onPress={handleShare}
          >
            <Icon name="share" size={18} color={theme.text2} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['5xl'],
    padding: 28,
    paddingTop: 34,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteMark: {
    position: 'absolute',
    top: -10,
    right: 16,
    fontSize: 170,
    lineHeight: 170,
    opacity: 0.07,
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
});

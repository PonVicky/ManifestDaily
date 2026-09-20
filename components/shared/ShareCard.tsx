import React, { useMemo } from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { GOALS, GoalId, goalIdForAffirmation } from '../../constants/data';

// Logical size of the exported card. 9:16 (Instagram Stories); the capture
// step scales this up to ~1080px wide. Fixed in dp rather than derived from
// the device so the layout is identical on every phone — only the output
// resolution varies.
export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 640;

interface ShareCardProps {
  text: string;
  // Same prop name/shape as AffSlide — pass it for custom affirmations (which
  // can't be reverse-looked-up from the built-in pool); built-ins can omit it.
  goalId?: GoalId | null;
  // Defaults to the bg5 photo the affirmation is already shown over, per theme.
  backgroundImage?: ImageSourcePropType;
  // Fires once the background photo has decoded. The capture MUST wait for
  // this — capturing earlier yields a card with a blank background.
  onReady?: () => void;
}

/**
 * The off-screen 9:16 card rendered for "share as image".
 *
 * Deliberately a re-lay-out of AffSlide, not a new design: same category
 * eyebrow, same serif italic affirmation with the same length-driven size
 * ladder, same 40x1 gold rule, same bg5 photo. What differs is only what
 * doesn't belong in an exported image — no heart/share buttons, no status or
 * tab bar, no per-slide opacity — plus a wordmark and a scrim (see below).
 */
export default function ShareCard({ text, goalId: goalIdProp, backgroundImage, onReady }: ShareCardProps) {
  const { theme, darkMode } = useTheme();

  const goalId = goalIdProp ?? goalIdForAffirmation(text);
  const goal = goalId ? GOALS.find((g) => g.id === goalId) : undefined;

  // Identical ladder to AffSlide, so a given affirmation sets at the same size
  // it does on screen.
  const textSize = useMemo(() => {
    const len = text.length;
    if (len <= 60) return { fontSize: 33, lineHeight: 47 };
    if (len <= 90) return { fontSize: 28, lineHeight: 40 };
    if (len <= 120) return { fontSize: 24, lineHeight: 34 };
    if (len <= 150) return { fontSize: 21, lineHeight: 30 };
    return { fontSize: 19, lineHeight: 27 };
  }, [text]);

  const source =
    backgroundImage ??
    (darkMode
      ? require('../../assets/bg5_dark.webp')
      : require('../../assets/bg5_lite.webp'));

  // The in-app feed has no scrim — it doesn't need one, because the slide is
  // always composited over theme.bg and the user can scroll. An exported image
  // lands on someone else's screen, cropped to 9:16, over whichever part of
  // the photo happens to fall behind the text. This very light wash of
  // theme.bg from both edges keeps the serif readable without visibly
  // changing the treatment.
  const scrim = darkMode
    ? (['rgba(23,18,16,0.55)', 'rgba(23,18,16,0.15)', 'rgba(23,18,16,0.6)'] as const)
    : (['rgba(251,243,231,0.55)', 'rgba(251,243,231,0.15)', 'rgba(251,243,231,0.65)'] as const);

  return (
    <ImageBackground
      source={source}
      resizeMode="cover"
      style={[styles.card, { backgroundColor: theme.bg }]}
      onLoadEnd={onReady}
    >
      <LinearGradient colors={scrim} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        {/* Category eyebrow — same sparkle + uppercase goldDark as AffSlide */}
        {goal && (
          <Text style={[styles.eyebrow, { color: theme.goldDark, fontFamily: 'DMSans_500Medium' }]}>
            ✦ {goal.label.toUpperCase()}
          </Text>
        )}

        {/* Affirmation */}
        <Text
          style={[
            styles.affirmationText,
            {
              color: theme.text,
              fontFamily: 'DMSerifDisplay_400Regular_Italic',
              fontSize: textSize.fontSize,
              lineHeight: textSize.lineHeight,
            },
          ]}
        >
          {text}
        </Text>

        {/* Accent rule */}
        <View style={[styles.rule, { backgroundColor: theme.goldDark }]} />
      </View>

      {/* Wordmark, in the same muted gold as the category label */}
      <Text style={[styles.wordmark, { color: theme.goldDark, fontFamily: 'DMSans_500Medium' }]}>
        ManifestDaily
      </Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    paddingHorizontal: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  affirmationText: {
    letterSpacing: -0.3,
    textAlign: 'center',
    maxWidth: 292,
    marginBottom: 24,
  },
  rule: {
    width: 40,
    height: 1,
  },
  wordmark: {
    fontSize: 12,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginBottom: 28,
  },
});

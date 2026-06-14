import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, shadow, shadowDark } from '../constants/tokens';
import { GOALS, AFFIRMATIONS, GoalId } from '../constants/data';
import Icon from '../components/ui/Icon';

// Saved affirmations only store their text, so recover each one's goal by
// finding which goal's set contains it (for the ✦ tag).
function goalForText(text: string) {
  const id = (Object.keys(AFFIRMATIONS) as GoalId[]).find((g) =>
    AFFIRMATIONS[g].includes(text),
  );
  return id ? GOALS.find((x) => x.id === id) : undefined;
}

export default function SavedAffirmationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, darkMode } = useTheme();

  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const toggleSaveAffirmation = useAppStore((s) => s.toggleSaveAffirmation);
  const sh = darkMode ? shadowDark.lg : shadow.lg;

  // Most recently saved first (the store appends new saves to the end).
  const items = [...savedAffirmations].reverse();

  const handleUnsave = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveAffirmation(text);
  };

  return (
    <ImageBackground
      source={darkMode ? require('../assets/bg6_dark.webp') : require('../assets/bg6_lite.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.handle, { backgroundColor: theme.border }]} />

      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : spacing.lg }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
          Saved Affirmations
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          activeOpacity={0.75}
        >
          <Icon name="close" size={16} color={theme.text2} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            No saved affirmations yet.{'\n'}Tap the ♡ on any affirmation to save it.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {items.map((text, i) => {
            const goal = goalForText(text);
            return (
              <View
                key={`${text}-${i}`}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}
              >
                {/* Opaque warm gradient fill, matching the home affirmation card */}
                <LinearGradient
                  colors={[theme.sel, theme.card]}
                  locations={[0, 0.55]}
                  start={{ x: 0.4, y: 0 }}
                  end={{ x: 0.6, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                {goal && (
                  <Text style={[styles.goalTag, { color: theme.gold, fontFamily: 'DMSans_500Medium' }]}>
                    ✦ {goal.label}
                  </Text>
                )}

                <Text
                  style={[
                    styles.affirmationText,
                    { color: theme.gold, fontFamily: 'DMSerifDisplay_400Regular_Italic' },
                  ]}
                >
                  {text}
                </Text>

                <View style={styles.pillRow}>
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: theme.gold, backgroundColor: theme.sel }]}
                    onPress={() => handleUnsave(text)}
                    activeOpacity={0.85}
                  >
                    <Icon name="heart" size={18} color={theme.gold} fill={theme.gold} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['3xl'],
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius['5xl'],
    padding: 28,
    paddingTop: 34,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  goalTag: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
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

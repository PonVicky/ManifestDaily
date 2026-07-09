import React, { useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing, fontSize, shadow, shadowDark } from '../../constants/tokens';
import Icon, { IconName } from './Icon';
import Mascot from './Mascot';

// Bump this alongside app.json's `version` when shipping a new release note.
export const WHATS_NEW_VERSION = '1.1.2';

// Only changes a user can actually see or feel — internal refactors and fixes
// with no visible surface don't belong here.
const CHANGES: { icon: IconName; title: string; sub: string }[] = [
  {
    icon: 'flame',
    title: 'Streaks, reimagined',
    sub: 'Opening the app each day now keeps your streak alive — a little banner drops in to celebrate, and we’ll nudge you at night before a streak slips away.',
  },
  {
    icon: 'wind',
    title: 'Breathing sessions count',
    sub: 'Breathing now counts toward your streak, sessions, and focus hours — just like focus sessions.',
  },
  {
    icon: 'lock',
    title: 'Sort your Vault',
    sub: 'Order vaults by newest, oldest, or opening soon — and flip your recent sessions list too.',
  },
  {
    icon: 'bookmark',
    title: 'Reflect picks up where you left off',
    sub: 'Reopen the app and the affirmation feed returns to the exact slide you were reading.',
  },
  {
    icon: 'bell',
    title: 'Smarter reminders',
    sub: 'Duplicate daily reminders are gone for good, and the morning reminder now arrives at 11:11.',
  },
  {
    icon: 'sparkle',
    title: 'Fresh affirmations',
    sub: 'New lines added across every goal — shorter, punchier, easier to carry through your day.',
  },
];

// Staggered entrance used across onboarding (see allset.tsx): each child fades
// in while drifting up, offset by `delay` ms. Mounted fresh on every Modal
// open, so the stagger replays each time the sheet is shown.
function Reveal({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 420 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// Size of one grid cell, px.
const GRID_SIZE = 36;

// A subtle full-page grid drawn with a single SVG pattern (one <Rect>, so it
// costs next to nothing to render), fading out toward the bottom so the cards
// and button sit on calm ground. Theme-aware via the border color.
function GridBackground() {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            {/* One top edge + one left edge per cell tiles into a full grid. */}
            <Path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke={theme.border}
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" opacity={0.55} />
      </Svg>
      {/* Fade the grid away toward the bottom half of the page. */}
      <LinearGradient
        colors={['transparent', theme.bg]}
        start={{ x: 0, y: 0.25 }}
        end={{ x: 0, y: 0.95 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

interface WhatsNewSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function WhatsNewSheet({ visible, onClose }: WhatsNewSheetProps) {
  const { theme, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.sm : shadow.sm;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <GridBackground />
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          activeOpacity={0.75}
        >
          <Icon name="close" size={16} color={theme.text2} strokeWidth={2} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Reveal delay={80}>
            <View style={styles.hero}>
              <Mascot state="meditate" size={110} float halo />
              <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
                What&rsquo;s New
              </Text>
              <View style={[styles.versionPill, { backgroundColor: theme.goldSoft }]}>
                <Text style={[styles.versionText, { color: darkMode ? theme.gold : theme.goldDark, fontFamily: 'DMSans_500Medium' }]}>
                  v{WHATS_NEW_VERSION}
                </Text>
              </View>
            </View>
          </Reveal>

          <View style={styles.list}>
            {CHANGES.map((change, i) => (
              <Reveal key={change.title} delay={240 + i * 110}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}>
                  <View style={[styles.cardIcon, { backgroundColor: theme.bg2 }]}>
                    <Icon name={change.icon} size={19} color={theme.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                      {change.title}
                    </Text>
                    <Text style={[styles.cardSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                      {change.sub}
                    </Text>
                  </View>
                </View>
              </Reveal>
            ))}
          </View>

          <Reveal delay={240 + CHANGES.length * 110}>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: theme.gold }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: theme.onAccent, fontFamily: 'DMSans_500Medium' }]}>
                Nice!
              </Text>
            </TouchableOpacity>
          </Reveal>
        </ScrollView>
      </View>
    </Modal>
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
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: spacing.xl,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['3xl'],
    letterSpacing: -0.3,
    marginTop: spacing.xs,
  },
  versionPill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  versionText: {
    fontSize: fontSize.sm,
    letterSpacing: 0.4,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: fontSize.md },
  cardSub: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    paddingVertical: spacing.base,
    marginTop: spacing.xl,
  },
  doneBtnText: {
    fontSize: fontSize.md,
  },
});

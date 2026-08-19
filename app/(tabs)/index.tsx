import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { isGated, presentPaywall } from '../../lib/featureAccess';
import { spacing, radius, shadow, shadowDark } from '../../constants/tokens';
import { GOALS } from '../../constants/data';
import AffirmationCard from '../../components/ui/AffirmationCard';
import StreakBadge from '../../components/ui/StreakBadge';
import Mascot from '../../components/ui/Mascot';
import Icon, { IconName } from '../../components/ui/Icon';
import ScreenTransition from '../../components/shared/ScreenTransition';
import ThemedBackground from '../../components/ui/ThemedBackground';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// The screen renders in place with no entrance animation.
function Reveal({ children }: { delay: number; children: React.ReactNode }) {
  return <>{children}</>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const isPremium = useAppStore((s) => s.isPremium);
  const focusMinutes = useAppStore((s) => s.focusMinutes);
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.md : shadow.md;
  const shSm = darkMode ? shadowDark.sm : shadow.sm;

  const goalId = selectedGoals[0] ?? 'confidence';
  const goal = GOALS.find((g) => g.id === goalId);

  return (
    <ScreenTransition>
      <ThemedBackground>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Reveal delay={0}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text
                  style={[
                    styles.greeting,
                    {
                      color: theme.text,
                      fontFamily: 'DMSans_400Regular',
                      textShadowColor: theme.bg,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 4,
                    },
                  ]}
                >
                  {getGreeting().toUpperCase()}
                </Text>
                <Text style={[styles.date, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
                  {getDateString()}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={() => router.push('/settings')}
                  style={[styles.themeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  activeOpacity={0.8}
                >
                  <Icon name="settings" size={18} color={theme.gold} />
                </TouchableOpacity>
                <StreakBadge />
              </View>
            </View>
          </Reveal>

          {/* Mascot + today's intention */}
          <Reveal delay={90}>
            <View style={styles.mascotArea}>
              <Mascot state="meditate" size={126} float halo />
              {goal && (
                <Text
                  style={[
                    styles.intention,
                    {
                      color: theme.text,
                      fontFamily: 'DMSans_400Regular',
                      textShadowColor: theme.bg,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 4,
                    },
                  ]}
                >
                  Gently focused on{' '}
                  <Text style={{ color: theme.goldDark, fontFamily: 'DMSans_500Medium' }}>{goal.label}</Text>
                </Text>
              )}
            </View>
          </Reveal>

          {/* Affirmation card — the centerpiece */}
          <Reveal delay={170}>
            <AffirmationCard />
          </Reveal>

          {/* Begin today ritual */}
          <Reveal delay={250}>
            <View style={styles.ritual}>
              <Text style={[styles.ritualHeading, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
                Begin today
              </Text>

              {/* Primary practice */}
              <TouchableOpacity
                style={[
                  styles.primaryCard,
                  { backgroundColor: theme.sel, borderColor: theme.goldSoft, ...sh },
                ]}
                onPress={() => router.push('/(tabs)/focus')}
                activeOpacity={0.9}
              >
                <View style={[styles.primaryIcon, { backgroundColor: theme.gold }]}>
                  <Icon name="focus" size={24} color={theme.onAccent} />
                </View>
                <View style={styles.primaryText}>
                  <Text style={[styles.primaryTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                    Focus session
                  </Text>
                  <Text style={[styles.primarySub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                    Settle in for {focusMinutes} quiet minutes
                  </Text>
                </View>
                <View style={[styles.primaryArrow, { backgroundColor: theme.cardSolid, borderColor: theme.goldSoft }]}>
                  <Icon name="arrowR" size={18} color={theme.gold} />
                </View>
              </TouchableOpacity>

              {/* Secondary practices */}
              <View style={styles.secondaryRow}>
                <SecondaryTile
                  icon="wind"
                  title="Breathing"
                  sub="2 min reset"
                  // emoji="🌬️"
                  onPress={() => {
                    if (isGated('breathing', isPremium)) {
                      presentPaywall(router, 'breathing');
                      return;
                    }
                    router.push('/breathing');
                  }}
                  theme={theme}
                  shadowStyle={shSm}
                />
                <SecondaryTile
                  icon="mail"
                  title="Time capsule"
                  sub="Write forward"
                  // emoji="💭"
                  onPress={() => router.push('/(tabs)/vault')}
                  theme={theme}
                  shadowStyle={shSm}
                />
              </View>
            </View>
          </Reveal>
        </ScrollView>
      </ThemedBackground>
    </ScreenTransition>
  );
}

function SecondaryTile({
  icon,
  title,
  sub,
  emoji,
  onPress,
  theme,
  shadowStyle,
}: {
  icon: IconName;
  title: string;
  sub: string;
  emoji?: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  shadowStyle: object;
}) {
  return (
    <TouchableOpacity
      style={[styles.secondaryTile, { backgroundColor: theme.card, borderColor: theme.border, ...shadowStyle }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {emoji && <Text style={styles.cornerEmoji}>{emoji}</Text>}
      <View style={[styles.secondaryIcon, { backgroundColor: theme.bg2 }]}>
        <Icon name={icon} size={20} color={theme.text2} />
      </View>
      <Text style={[styles.secondaryTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
        {title}
      </Text>
      <Text style={[styles.secondarySub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 4,
  },
  date: {
    fontSize: 27,
    letterSpacing: -0.3,
  },
  mascotArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  intention: {
    fontSize: 13,
    textAlign: 'center',
  },
  ritual: {
    gap: spacing.md,
  },
  ritualHeading: {
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: radius['4xl'],
    borderWidth: 1,
    padding: spacing.lg,
  },
  primaryIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    flex: 1,
    gap: 3,
  },
  primaryTitle: {
    fontSize: 18,
  },
  primarySub: {
    fontSize: 13,
  },
  primaryArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryTile: {
    flex: 1,
    borderRadius: radius['4xl'],
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 120,
  },
  secondaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTitle: {
    fontSize: 16,
  },
  secondarySub: {
    fontSize: 13,
  },
  cornerEmoji: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontSize: 28,
  },
});

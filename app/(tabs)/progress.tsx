import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildMonthActivity, useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/theme';
import { spacing, radius, fontSize, shadow, shadowDark } from '../../constants/tokens';
import ActivityCalendar from '../../components/ui/ActivityCalendar';
import Mascot from '../../components/ui/Mascot';
import Card from '../../components/shared/Card';
import Icon, { IconName } from '../../components/ui/Icon';
import ScreenTransition from '../../components/shared/ScreenTransition';
import ThemedBackground from '../../components/ui/ThemedBackground';

interface StatCellProps {
  value: string | number;
  label: string;
  icon: IconName;
  iconColor?: string;
  iconFill?: string;
  borderRight?: boolean;
  borderBottom?: boolean;
  theme: ThemeColors;
}

function StatCell({
  value,
  label,
  icon,
  iconColor,
  iconFill,
  borderRight = false,
  borderBottom = false,
  theme,
}: StatCellProps) {
  return (
    <View
      style={[
        styles.statCell,
        {
          borderColor: theme.border,
          borderRightWidth: borderRight ? 1 : 0,
          borderBottomWidth: borderBottom ? 1 : 0,
        },
      ]}
    >
      <View style={styles.statCellTop}>
        <Text style={[styles.statEyebrow, { color: theme.text2, fontFamily: 'DMSans_500Medium' }]}>
          {label}
        </Text>
        <Icon
          name={icon}
          size={15}
          color={iconColor ?? theme.text2}
          fill={iconFill}
          strokeWidth={1.6}
        />
      </View>
      <Text style={[styles.statValue, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
        {value}
      </Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { theme, darkMode } = useTheme();
  const bestStreak = useAppStore((s) => s.bestStreak);
  const totalSessions = useAppStore((s) => s.totalSessions);
  const focusHours = useAppStore((s) => s.focusHours);
  // Subscribe to sessions so the insight re-derives after a session is logged.
  useAppStore((s) => s.sessions);
  const insight = useAppStore((s) => s.focusInsight)();
  const streak = useAppStore((s) => s.streak)();
  const streakDays = useAppStore((s) => s.streakDays);
  const monthLabel = useMemo(() => buildMonthActivity(streakDays).monthLabel, [streakDays]);
  const insets = useSafeAreaInsets();

  return (
    <ScreenTransition>
    <ThemedBackground>
      {/* Corner mascot — absolutely positioned so it doesn't affect layout flow */}
      <View style={[styles.cornerMascot, { top: insets.top + 4 }]}>
        <Mascot state="zen" size={88} opacity={0.9} />
      </View>

    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
        Progress
      </Text>

      {/* Stats panel — one card split into four quadrants by interior hairlines */}
      <View
        style={[
          styles.statsCard,
          { backgroundColor: theme.card, borderColor: theme.border, ...(darkMode ? shadowDark.sm : shadow.sm) },
        ]}
      >
        <View style={styles.statsGrid}>
          <StatCell
            value={streak}
            label="Day Streak"
            icon="target"
            iconColor={theme.gold}
            iconFill={theme.gold}
            borderRight
            borderBottom
            theme={theme}
          />
          <StatCell
            value={bestStreak}
            label="Best Streak"
            icon="star"
            borderBottom
            theme={theme}
          />
          <StatCell
            value={totalSessions}
            label="Sessions"
            icon="check"
            borderRight
            theme={theme}
          />
          <StatCell
            value={focusHours}
            label="Focus Hours"
            icon="clock"
            theme={theme}
          />
        </View>
      </View>

      {/* First-time nudge — only while no session has been logged yet. Keyed
          off sessions alone (not the streak, which now ticks on app open) so
          new users still see it. Styled like the insight box below (its
          data-present counterpart) so it reads as a hint on a solid surface
          instead of muted text floating on the illustrated background. */}
      {totalSessions === 0 && (
        <View
          style={[
            styles.insightBox,
            { backgroundColor: theme.sel, borderColor: theme.goldSoft, marginBottom: 14 },
          ]}
        >
          <Icon name="sparkle" size={18} color={theme.gold} fill={theme.gold} />
          <Text style={[styles.insightText, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}>
            Complete your first session to start logging your focus time
          </Text>
        </View>
      )}

      {/* Activity calendar */}
      <Card padding={20} style={{ marginTop: 6 }}>
        <View style={styles.calendarHeader}>
          <Text
            style={[styles.cardTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}
          >
            Activity
          </Text>
          <Text
            style={[styles.cardSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
          >
            {monthLabel}
          </Text>
        </View>
        <ActivityCalendar />
      </Card>

      {/* Insight box — derived from real session timestamps; hidden until there's data */}
      {insight && (
        <View
          style={[
            styles.insightBox,
            { backgroundColor: theme.sel, borderColor: theme.goldSoft, marginTop: 14 },
          ]}
        >
          <Icon name="sparkle" size={18} color={theme.gold} fill={theme.gold} />
          <Text style={[styles.insightText, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}>
            {insight}
          </Text>
        </View>
      )}
    </ScrollView>
    </ThemedBackground>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
  },
  cornerMascot: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
  },
  title: {
    fontSize: 34,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  statsCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    width: '50%',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  statCellTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 34,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: fontSize.xl,
  },
  cardSub: {
    fontSize: 12,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing.base,
  },
  insightText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
});

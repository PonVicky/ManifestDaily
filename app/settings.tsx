import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { useAppStore } from '../store/useAppStore';
import Icon, { IconName } from '../components/ui/Icon';
import { GOALS, GoalId, REMINDER_OPTIONS } from '../constants/data';
import { radius, spacing, fontSize, shadow, shadowDark } from '../constants/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, darkMode } = useTheme();
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const reminderTimes = useAppStore((s) => s.reminderTimes);
  const notificationsOn = useAppStore((s) => s.notificationIds.length > 0);
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const setGoals = useAppStore((s) => s.setGoals);
  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const sessions = useAppStore((s) => s.sessions);
  const totalSessions = useAppStore((s) => s.totalSessions);
  const focusHours = useAppStore((s) => s.focusHours);
  const bestStreak = useAppStore((s) => s.bestStreak);
  const vaults = useAppStore((s) => s.vaults);
  const streak = useAppStore((s) => s.streak);
  const { requestPermissions, scheduleReminders, cancelAll } = useNotifications();
  const sh = darkMode ? shadowDark.sm : shadow.sm;

  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const currentGoalId = selectedGoals[0] ?? 'confidence';
  const currentGoal = GOALS.find((g) => g.id === currentGoalId);
  const goalsLabel = selectedGoals.length
    ? selectedGoals.map((id) => GOALS.find((g) => g.id === id)?.label ?? id).join(', ')
    : 'Choose a goal';

  // Fall back to a single morning reminder if none were ever picked.
  const activeReminderTimes = reminderTimes.length ? reminderTimes : (['morning'] as const);

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (granted) await scheduleReminders([...activeReminderTimes]);
    } else {
      await cancelAll();
    }
  };

  const handleToggleGoal = async (goalId: GoalId) => {
    const isSelected = selectedGoals.includes(goalId);
    if (isSelected && selectedGoals.length === 1) return;
    const next = isSelected
      ? selectedGoals.filter((id) => id !== goalId)
      : [...selectedGoals, goalId];
    setGoals(next);
    // Keep the daily reminders' affirmation in sync with the new goals.
    if (notificationsOn) {
      await scheduleReminders([...activeReminderTimes]);
    }
  };

  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert(
          'Sharing Unavailable',
          "Your device doesn't support file sharing.",
          [{ text: 'OK' }],
        );
        return;
      }

      const data = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        profile: {
          goals: [...selectedGoals],
          reminderTimes: [...reminderTimes],
          streak: streak(),
          bestStreak,
          totalSessions,
          focusHours,
        },
        savedAffirmations: [...savedAffirmations],
        sessions: [...sessions],
        vaults: vaults.map((v) => ({
          message: v.message,
          createdAt: v.created,
          unlockAt: v.unlock,
          isOpened: v.opened ?? false,
        })),
      };

      const json = JSON.stringify(data, null, 2);
      const today = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `ManifestDaily-backup-${today}.json`);
      file.create({ overwrite: true });
      file.write(json);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export My Data',
        UTI: 'public.json',
      });
    } catch {
      Alert.alert(
        'Export Failed',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.handle, { backgroundColor: theme.border }]} />

      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : spacing.lg }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
          Appearance
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          activeOpacity={0.75}
        >
          <Icon name="close" size={16} color={theme.text2} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: theme.bg2 }]}>
              <Icon name={darkMode ? 'moon' : 'sun'} size={18} color={theme.gold} />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                Dark Mode
              </Text>
              <Text style={[styles.rowSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                {darkMode ? 'On — darker appearance' : 'Off — lighter appearance'}
              </Text>
            </View>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.border, true: theme.gold }}
            thumbColor={theme.white}
          />
        </View>

        <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: theme.bg2 }]}>
              <Icon name="bell" size={18} color={theme.gold} />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                Daily reminders
              </Text>
              <Text style={[styles.rowSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                {notificationsOn
                  ? `On — ${activeReminderTimes
                      .map((id) => REMINDER_OPTIONS.find((r) => r.id === id)?.label ?? id)
                      .join(', ')}`
                  : 'Off — no reminders'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: theme.border, true: theme.gold }}
            thumbColor={theme.white}
          />
        </View>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}
          onPress={() => setGoalPickerOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: theme.bg2 }]}>
              <Icon name={(currentGoal?.icon as IconName) ?? 'sparkle'} size={18} color={theme.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                Focus goal
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.rowSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
              >
                {goalsLabel}
              </Text>
            </View>
          </View>
          <Icon name="arrowR" size={18} color={theme.text2} />
        </TouchableOpacity>

        {/* ── Data & Privacy ───────────────────────────────────── */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.text2, fontFamily: 'DMSans_500Medium' },
          ]}
        >
          Data & Privacy
        </Text>

        <View
          style={[
            styles.noticeCard,
            { backgroundColor: theme.bg2, borderColor: theme.border },
          ]}
        >
          <Icon name="lock" size={20} color={theme.text2} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.noticeTitle, { color: theme.text2, fontFamily: 'DMSans_500Medium' }]}>
              Your data stays on your device
            </Text>
            <Text style={[styles.noticeBody, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
              We never collect, store, or share your personal data. No account needed.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}
          onPress={exportData}
          disabled={exporting}
          activeOpacity={0.8}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: theme.bg2 }]}>
              <Icon name="download" size={18} color={theme.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                Export My Data
              </Text>
              <Text style={[styles.rowSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                Save a backup to your Files app
              </Text>
            </View>
          </View>
          {exporting ? (
            <ActivityIndicator size="small" color={theme.text2} />
          ) : (
            <Icon name="arrowR" size={18} color={theme.text2} />
          )}
        </TouchableOpacity>

        <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border, ...sh, opacity: 0.7 }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: theme.bg2 }]}>
              <Icon name="info" size={18} color={theme.text2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                Storage
              </Text>
              <Text style={[styles.rowSub, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
                All data stored locally on device
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            ManifestDaily v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            Made with ♥ by Bepel
          </Text>
        </View>
      </ScrollView>

      {/* Change-goal action sheet */}
      <Modal
        visible={goalPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setGoalPickerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheet,
              { backgroundColor: theme.bg, paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
              Choose your goals
            </Text>

            {GOALS.map((g) => {
              const isSelected = selectedGoals.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isSelected ? theme.accentTint : theme.card,
                      borderColor: isSelected ? theme.gold : theme.border,
                    },
                  ]}
                  onPress={() => handleToggleGoal(g.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIcon, { backgroundColor: isSelected ? theme.goldSoft : theme.bg2 }]}>
                      <Icon name={g.icon as IconName} size={18} color={isSelected ? theme.gold : theme.text2} />
                    </View>
                    <Text style={[styles.rowTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                      {g.label}
                    </Text>
                  </View>
                  {isSelected && <Icon name="check" size={18} color={theme.gold} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: theme.gold }]}
              onPress={() => setGoalPickerOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: theme.onAccent, fontFamily: 'DMSans_500Medium' }]}>
                Done
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: fontSize.md },
  rowSub: { fontSize: 12, marginTop: 1 },
  sectionLabel: {
    fontSize: fontSize.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: -spacing.sm + 2,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 2,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  noticeTitle: { fontSize: fontSize.base, marginBottom: 4 },
  noticeBody: { fontSize: 12, lineHeight: 18 },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  sheetTitle: {
    fontSize: fontSize['2xl'],
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    paddingVertical: spacing.base,
    marginTop: spacing.xs,
  },
  doneBtnText: {
    fontSize: fontSize.md,
  },
});

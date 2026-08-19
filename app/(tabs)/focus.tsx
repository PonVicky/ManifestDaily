import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize, shadow, shadowDark } from '../../constants/tokens';
import { FOCUS_DURATIONS, SOUNDS, FocusDuration, SoundId } from '../../constants/data';
import { isGated, presentPaywall } from '../../lib/featureAccess';
import { CHALLENGE_SOURCE, CHALLENGE_TOTAL_DAYS } from '../../constants/deepLinks';
import Button from '../../components/shared/Button';
import Icon, { IconName } from '../../components/ui/Icon';
import Mascot from '../../components/ui/Mascot';
import ScreenTransition from '../../components/shared/ScreenTransition';
import ThemedBackground from '../../components/ui/ThemedBackground';
import DurationPicker from '../../components/ui/DurationPicker';

// Custom duration label, e.g. 90 -> "1h 30m", 45 -> "45m".
function formatCustomDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Countdown label, e.g. 90 -> "01:30".
function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function FocusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { theme, darkMode } = useTheme();
  const isChallenge = params.source === CHALLENGE_SOURCE;
  const streak = useAppStore((s) => s.streak)();
  const isPremium = useAppStore((s) => s.isPremium);
  const focusMinutes = useAppStore((s) => s.focusMinutes);
  const selectedSound = useAppStore((s) => s.selectedSound);
  const setFocusMinutes = useAppStore((s) => s.setFocusMinutes);
  const setSound = useAppStore((s) => s.setSound);
  // Subscribe to sessions so the Recent list re-renders after a session is logged.
  useAppStore((s) => s.sessions);
  const recent = useAppStore((s) => s.recentSessions)();
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.sm : shadow.sm;

  // `recent` comes back newest-first from the store; flipping the order here
  // (rather than in the store) keeps recentSessions() untouched for anything
  // else that reads it.
  const [recentOldestFirst, setRecentOldestFirst] = useState(false);
  const orderedRecent = recentOldestFirst ? [...recent].reverse() : recent;

  // A session that was swiped away mid-run is paused, not lost — offer to
  // continue it instead of "Begin" until the user picks it back up.
  const pausedSession = useAppStore((s) => s.pausedSession);

  const isCustom = !(FOCUS_DURATIONS as readonly number[]).includes(focusMinutes);
  const [customOpen, setCustomOpen] = useState(false);
  const [customHours, setCustomHours] = useState(Math.floor(focusMinutes / 60));
  const [customMinutes, setCustomMinutes] = useState(focusMinutes % 60);

  // Ambient audio is premium. The picker below is gated too, but a sound can
  // already be persisted/paused-in (e.g. a lapsed Android subscription), so
  // strip it when starting the session rather than playing it for free.
  const audioGated = isGated('ambientAudio', isPremium);

  const handleBegin = () => {
    router.push({
      pathname: '/session',
      params: { minutes: focusMinutes, sound: audioGated ? '' : selectedSound ?? '' },
    });
  };

  const handleContinue = () => {
    if (!pausedSession) return;
    router.push({
      pathname: '/session',
      params: {
        minutes: pausedSession.minutes,
        sound: audioGated ? '' : pausedSession.sound ?? '',
        remaining: pausedSession.remainingMs,
      },
    });
  };

  const openCustomPicker = () => {
    if (isGated('customDurations', isPremium)) {
      presentPaywall(router, 'customDurations');
      return;
    }
    setCustomHours(Math.floor(focusMinutes / 60));
    setCustomMinutes(focusMinutes % 60);
    setCustomOpen(true);
  };

  const handleConfirmCustom = () => {
    const total = Math.max(1, customHours * 60 + customMinutes);
    setFocusMinutes(total as FocusDuration);
    setCustomOpen(false);
  };

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
          {/* Corner mascot */}
          <View style={styles.mascotCorner}>
            <Mascot
              state="side"
              size={148}
              opacity={0.85}
            />
          </View>

          {isChallenge && (
            <View style={[styles.challengePill, { backgroundColor: theme.sel, borderColor: theme.gold }]}>
              <Icon name="flame" size={16} color={theme.gold} fill={theme.gold} strokeWidth={1.6} />
              <Text style={[styles.challengeText, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                Day {streak} of {CHALLENGE_TOTAL_DAYS} · Manifestation Challenge
              </Text>
            </View>
          )}

          <View style={styles.titleArea}>
            <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
              Focus
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.text,
                  fontFamily: 'DMSans_400Regular',
                  textShadowColor: theme.bg,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 4,
                },
              ]}
            >
              Choose a length, settle in.
            </Text>
          </View>

          {/* Duration selector */}
          <View style={styles.durationRow}>
            {FOCUS_DURATIONS.map((min) => {
              const isSelected = focusMinutes === min;
              return (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.durationPill,
                    {
                      backgroundColor: isSelected ? theme.sel : theme.cardSolid,
                      borderColor: isSelected ? theme.gold : theme.border,
                      ...(isSelected ? {} : sh),
                    },
                  ]}
                  onPress={() => setFocusMinutes(min as FocusDuration)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.durationNumber,
                      {
                        color: isSelected ? theme.gold : theme.text,
                        fontFamily: 'DMSerifDisplay_400Regular',
                      },
                    ]}
                  >
                    {min}
                  </Text>
                  <Text
                    style={[
                      styles.durationUnit,
                      { color: theme.text2, fontFamily: 'DMSans_400Regular' },
                    ]}
                  >
                    minutes
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom duration */}
            <TouchableOpacity
              style={[
                styles.durationPill,
                {
                  backgroundColor: isCustom ? theme.sel : theme.cardSolid,
                  borderColor: isCustom ? theme.gold : theme.border,
                  ...(isCustom ? {} : sh),
                },
              ]}
              onPress={openCustomPicker}
              activeOpacity={0.8}
            >
              {isCustom ? (
                <Text
                  style={[
                    styles.durationNumber,
                    { color: theme.gold, fontFamily: 'DMSerifDisplay_400Regular' },
                  ]}
                >
                  {formatCustomDuration(focusMinutes)}
                </Text>
              ) : (
                <Icon name="clock" size={22} color={theme.text} />
              )}
              <Text
                style={[
                  styles.durationUnit,
                  { color: isCustom ? theme.gold : theme.text2, fontFamily: 'DMSans_400Regular' },
                ]}
              >
                custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ambient sound */}
          <View style={styles.soundSection}>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: theme.text,
                  fontFamily: 'DMSans_500Medium',
                  textShadowColor: theme.bg,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 4,
                },
              ]}
            >
              AMBIENT SOUND
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.soundRow}>
                {/* Off option */}
                <TouchableOpacity
                  style={[
                    styles.soundChip,
                    {
                      backgroundColor: selectedSound === null ? theme.sel : theme.cardSolid,
                      borderColor: selectedSound === null ? theme.gold : theme.border,
                    },
                  ]}
                  onPress={() => setSound(null)}
                >
                  <Icon
                    name="mute"
                    size={22}
                    color={selectedSound === null ? theme.gold : theme.text2}
                  />
                  <Text
                    style={[
                      styles.soundLabel,
                      {
                        color: selectedSound === null ? theme.gold : theme.text2,
                        fontFamily: selectedSound === null ? 'DMSans_500Medium' : 'DMSans_400Regular',
                      },
                    ]}
                  >
                    Off
                  </Text>
                </TouchableOpacity>

                {SOUNDS.map((s) => {
                  const isSelected = selectedSound === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.soundChip,
                        {
                          backgroundColor: isSelected ? theme.sel : theme.cardSolid,
                          borderColor: isSelected ? theme.gold : theme.border,
                        },
                      ]}
                      onPress={() => {
                        if (audioGated) {
                          presentPaywall(router, 'ambientAudio');
                          return;
                        }
                        setSound(s.id as SoundId);
                      }}
                    >
                      <Icon
                        name={s.icon as IconName}
                        size={22}
                        color={isSelected ? theme.gold : theme.text2}
                      />
                      <Text
                        style={[
                          styles.soundLabel,
                          {
                            color: isSelected ? theme.gold : theme.text2,
                            fontFamily: isSelected ? 'DMSans_500Medium' : 'DMSans_400Regular',
                          },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Begin / continue button */}
          {pausedSession ? (
            <Button
              label={`Continue session · ${formatCountdown(Math.ceil(pausedSession.remainingMs / 1000))}`}
              onPress={handleContinue}
              variant="primary"
              icon="play"
            />
          ) : (
            <Button
              label={`Begin ${focusMinutes}-minute session`}
              onPress={handleBegin}
              variant="primary"
              icon="play"
            />
          )}

          {/* Recent sessions */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text
                style={[
                  styles.sectionLabel,
                  {
                    color: theme.text,
                    fontFamily: 'DMSans_500Medium',
                    textShadowColor: theme.bg,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 4,
                  },
                ]}
              >
                RECENT
              </Text>
              {recent.length > 1 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRecentOldestFirst((v) => !v);
                  }}
                  style={[
                    styles.sortPill,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12.5, color: theme.text }}>
                    {recentOldestFirst ? 'Oldest first' : 'Newest first'}
                  </Text>
                  <Icon name="chevD" size={12} color={theme.text2} />
                </Pressable>
              )}
            </View>
            {recent.length === 0 ? (
              <View
                style={[
                  styles.recentEmptyWrap,
                  { backgroundColor: theme.card, borderColor: theme.border, ...sh },
                ]}
              >
                <Icon name="clock" size={28} color={theme.gold} strokeWidth={1.6} />
                <Text
                  style={[styles.recentEmptyTitle, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}
                >
                  No sessions yet
                </Text>
                <Text
                  style={[styles.recentEmptyBody, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
                >
                  Complete your first focus session to see your history here.
                </Text>
              </View>
            ) : (
              orderedRecent.map((session, i) => (
                <View
                  key={i}
                  style={[
                    styles.recentRow,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      ...sh,
                    },
                  ]}
                >
                  <View style={[styles.checkBox, { backgroundColor: theme.accentTint }]}>
                    <Icon name="check" size={16} color={theme.gold} strokeWidth={2} />
                  </View>
                  <View style={styles.recentText}>
                    <Text
                      style={[styles.recentMain, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}
                    >
                      {session.duration} min · {session.sound}
                    </Text>
                  </View>
                  <Text
                    style={[styles.recentWhen, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
                  >
                    {session.when}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Custom duration picker */}
        <Modal
          visible={customOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCustomOpen(false)}
        >
          <View style={styles.sheetOverlay}>
            {/* Backdrop — tap to dismiss. Kept separate from the sheet so it
            doesn't intercept the picker's scroll gestures. */}
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setCustomOpen(false)} />

            <View
              style={[
                styles.sheet,
                { backgroundColor: theme.bg, paddingBottom: insets.bottom + spacing.lg },
              ]}
            >
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
              <Text style={[styles.sheetTitle, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
                Custom duration
              </Text>

              <DurationPicker
                value={{ hours: customHours, minutes: customMinutes }}
                onChange={(v) => {
                  setCustomHours(v.hours);
                  setCustomMinutes(v.minutes);
                }}
              />

              <Button label="Set duration" onPress={handleConfirmCustom} variant="primary" />
            </View>
          </View>
        </Modal>
      </ThemedBackground>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  mascotCorner: {
    position: 'absolute',
    top: 20,
    right: 0,
    zIndex: 1,
  },
  challengePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius['5xl'],
    borderWidth: 1,
  },
  challengeText: {
    fontSize: fontSize.sm,
  },
  titleArea: { gap: 6 },
  title: {
    fontSize: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.lg,
    lineHeight: 24,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  durationPill: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 4,
  },
  durationNumber: {
    fontSize: 30,
    lineHeight: 34,
  },
  durationUnit: {
    fontSize: 12,
  },
  soundSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.8,
  },
  soundRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  soundChip: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    minWidth: 72,
  },
  soundLabel: {
    fontSize: 12.5,
  },
  recentSection: {
    gap: spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing.md,
  },
  checkBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
  },
  recentMain: {
    fontSize: fontSize.md,
  },
  recentWhen: {
    fontSize: 13,
  },
  recentEmptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  recentEmptyTitle: {
    fontSize: fontSize.md,
  },
  recentEmptyBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
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
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    opacity: 0.35,
  },
  sheetTitle: {
    fontSize: fontSize['2xl'],
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
});

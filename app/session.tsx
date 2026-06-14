import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore, isStreakMilestone } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { useAudio } from '../hooks/useAudio';
import { spacing, shadow, shadowDark } from '../constants/tokens';
import TimerRing from '../components/ui/TimerRing';
import Mascot from '../components/ui/Mascot';
import Icon from '../components/ui/Icon';
import { FocusDuration, SoundId } from '../constants/data';

export default function SessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ minutes: string; sound: string; remaining?: string }>();
  const { theme, darkMode } = useTheme();
  const logSession = useAppStore((s) => s.logSession);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const clearActiveSession = useAppStore((s) => s.clearActiveSession);
  const setPausedSession = useAppStore((s) => s.setPausedSession);
  const clearPausedSession = useAppStore((s) => s.clearPausedSession);
  const { requestPermissions, scheduleSessionCompletion, cancelSessionCompletion } = useNotifications();
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.md : shadow.md;

  const minutes = parseInt(params.minutes ?? '25', 10) as FocusDuration;
  const sound = (params.sound || null) as SoundId | null;
  const totalSeconds = minutes * 60;

  // If `remaining` is provided, this screen was reopened from the Focus
  // tab's "Continue session" button for a session that was paused when it
  // was previously dismissed — pick up where it left off, still paused.
  const resumeRemainingMs = params.remaining ? parseInt(params.remaining, 10) : null;
  const isResumingPaused = resumeRemainingMs != null && resumeRemainingMs > 0;

  // Ambient sound only plays during an active session, starting on mount
  // and pausing/resuming with the session's play/pause control. A session
  // resumed in a paused state shouldn't start audio until the user presses play.
  const { pause: pauseAudio, resume: resumeAudio, stop: stopAudio } = useAudio(sound, !isResumingPaused);

  // The timer is driven by an absolute end time (Unix ms), not elapsed
  // ticks, so it self-corrects after the app is backgrounded and resumed.
  const [sessionEndTime, setSessionEndTime] = useState(
    () => Date.now() + (isResumingPaused ? resumeRemainingMs! : totalSeconds * 1000),
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((sessionEndTime - Date.now()) / 1000)),
  );
  const [paused, setPaused] = useState(isResumingPaused);
  const [completed, setCompleted] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Holds the id of the currently-scheduled completion notification, and the
  // remaining time at the moment the session was paused.
  const notificationIdRef = useRef<string | null>(null);
  const remainingMsRef = useRef(isResumingPaused ? resumeRemainingMs! : totalSeconds * 1000);
  // Set once the session is closed/completed, so a notification scheduled by
  // an in-flight async call (e.g. the user closed the screen before the
  // initial schedule finished) gets cancelled instead of left to fire later.
  const closedRef = useRef(false);

  // Mirror of `sessionEndTime`/`paused` for the unmount cleanup below, which
  // needs the latest values without re-running on every change.
  const sessionEndTimeRef = useRef(sessionEndTime);
  const pausedRef = useRef(paused);
  useEffect(() => {
    sessionEndTimeRef.current = sessionEndTime;
  }, [sessionEndTime]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // On mount, schedule the completion notification for the full session and
  // record the end time so a backgrounded/killed app can still be reasoned
  // about (see _layout.tsx's stale-session check). A session resumed from a
  // paused state stays paused — nothing to schedule until the user presses play.
  useEffect(() => {
    if (isResumingPaused) {
      clearPausedSession();
      return;
    }
    (async () => {
      await requestPermissions();
      const id = await scheduleSessionCompletion(totalSeconds, minutes);
      if (closedRef.current) {
        cancelSessionCompletion(id);
        return;
      }
      notificationIdRef.current = id;
      setActiveSession(sessionEndTime, id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the screen is dismissed (e.g. swiped away) without an explicit close
  // or completion, pause the session in place so the Focus tab can offer to
  // continue it later instead of silently losing progress.
  useEffect(() => {
    return () => {
      if (closedRef.current) return;
      const remainingMs = pausedRef.current
        ? remainingMsRef.current
        : Math.max(0, sessionEndTimeRef.current - Date.now());
      cancelSessionCompletion(notificationIdRef.current);
      clearActiveSession();
      if (remainingMs > 1000) {
        setPausedSession({ remainingMs, minutes, sound });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute the remaining time from the absolute end time every second.
  useEffect(() => {
    if (paused || completed) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, sessionEndTime - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, completed, sessionEndTime]);

  // Re-sync immediately when the app returns to the foreground, instead of
  // waiting for the next interval tick.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && !paused && !completed) {
        const remaining = Math.max(0, sessionEndTime - Date.now());
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    });
    return () => sub.remove();
  }, [sessionEndTime, paused, completed]);

  // Fire completion side-effects exactly once, when the clock hits zero.
  useEffect(() => {
    if (secondsLeft === 0 && !completed) {
      setCompleted(true);
      closedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logSession(minutes);
      // logSession is synchronous, so the streak selector already reflects this
      // session. If it just landed on a milestone, punctuate the moment with a
      // stronger haptic shortly after the completion chime so it reads as its
      // own celebratory beat. The effect runs once, so this fires once.
      if (isStreakMilestone(useAppStore.getState().streak())) {
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 450);
      }
      clearActiveSession();
      cancelSessionCompletion(notificationIdRef.current);
      notificationIdRef.current = null;
      stopAudio();
    }
  }, [secondsLeft, completed]);

  const progress = (totalSeconds - secondsLeft) / totalSeconds;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (paused) {
      // Resume: rebase the end time on the remaining time captured at pause,
      // and reschedule the completion notification for what's left.
      const newEndTime = Date.now() + remainingMsRef.current;
      setSessionEndTime(newEndTime);
      setPaused(false);
      resumeAudio();
      (async () => {
        await requestPermissions();
        const id = await scheduleSessionCompletion(remainingMsRef.current / 1000, minutes);
        if (closedRef.current) {
          cancelSessionCompletion(id);
          return;
        }
        notificationIdRef.current = id;
        setActiveSession(newEndTime, id);
      })();
    } else {
      // Pause: capture remaining time and cancel the pending notification so
      // it doesn't fire while the session is on hold.
      remainingMsRef.current = Math.max(0, sessionEndTime - Date.now());
      setPaused(true);
      pauseAudio();
      cancelSessionCompletion(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  };

  const handleClose = () => {
    closedRef.current = true;
    cancelSessionCompletion(notificationIdRef.current);
    notificationIdRef.current = null;
    clearActiveSession();
    stopAudio();
    router.back();
  };

  if (completed) {
    return (
      <ImageBackground
        source={darkMode ? require('../assets/bg_focus_dark.webp') : require('../assets/bg_focus_lite.webp')}
        resizeMode="cover"
        style={[styles.container, { backgroundColor: theme.bg }]}
      >
        {/* Warm top wash — light mode only; in dark mode it muddies the bg art. */}
        {!darkMode && (
          <LinearGradient
            colors={[theme.accentTint, 'transparent']}
            style={styles.topGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        )}
        <View style={[styles.completionContent, { paddingBottom: insets.bottom + 40 }]}>
          <Mascot state="celebrate" size={140} float halo />

          <View style={styles.completionText}>
            <Text
              style={[
                styles.completionTitle,
                { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' },
              ]}
            >
              Session complete
            </Text>
            <Text
              style={[
                styles.completionSub,
                { color: theme.text2, fontFamily: 'DMSans_400Regular' },
              ]}
            >
              {minutes} focused minutes. Well done.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.doneBtn,
              { backgroundColor: theme.gold, ...sh },
            ]}
            onPress={handleClose}
          >
            <Text
              style={[
                styles.doneBtnText,
                { color: theme.onAccent, fontFamily: 'DMSans_500Medium' },
              ]}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={darkMode ? require('../assets/bg_focus_dark.webp') : require('../assets/bg_focus_lite.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      {/* Warm top wash — light mode only; in dark mode it muddies the bg art. */}
      {!darkMode && (
        <LinearGradient
          colors={[theme.accentTint, 'transparent']}
          style={styles.topGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Timer ring */}
        <TimerRing
          progress={progress}
          timeString={timeString}
          soundId={sound}
        />

        {/* Status text */}
        <Text
          style={[
            styles.statusText,
            { color: theme.text2, fontFamily: 'DMSans_400Regular' },
          ]}
        >
          {paused ? 'Paused' : 'Stay with it.'}
        </Text>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Close */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              styles.closeControl,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={handleClose}
          >
            <Icon name="close" size={24} color={theme.text2} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              styles.playPauseBtn,
              { backgroundColor: theme.gold, ...sh },
            ]}
            onPress={handlePlayPause}
          >
            <Icon
              name={paused ? 'play' : 'pause'}
              size={24}
              color={theme.onAccent}
              fill={theme.onAccent}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
  },
  statusText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  closeControl: {
    width: 64,
    height: 64,
    borderWidth: 1,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
  },
  completionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  completionText: {
    alignItems: 'center',
    gap: spacing.md,
  },
  completionTitle: {
    fontSize: 30,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  completionSub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneBtn: {
    width: 220,
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 17,
  },
});

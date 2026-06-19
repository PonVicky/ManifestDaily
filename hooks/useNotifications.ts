import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/useAppStore';
import { ReminderTime } from '../constants/data';
import { rescheduleViaStore } from '../lib/reminderScheduler';

const SESSION_CHANNEL_ID = 'focus-session';
const VAULT_CHANNEL_ID = 'vault-unlocks';

// Show the reminder even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureSessionChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(SESSION_CHANNEL_ID, {
      name: 'Focus session',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

async function ensureVaultChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(VAULT_CHANNEL_ID, {
      name: 'Vault unlocks',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/**
 * The result of asking for notification permission. `granted` is whether we
 * currently have permission; `canAskAgain` is false once iOS has shown its
 * one-time system dialog and the user denied it — at that point the only way
 * back is for the user to flip it on in the system Settings app, so callers
 * should redirect there rather than silently failing.
 */
export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Daily affirmation reminders, backed by expo-notifications.
 *
 * - `requestPermissions` — asks for notification permission (no-op if already
 *   granted). Returns `{ granted, canAskAgain }` so callers can tell the
 *   "user just denied the dialog" case apart from the "iOS will never ask
 *   again, send them to Settings" case.
 * - `scheduleReminders` — schedules one repeating daily reminder per time in
 *   `times` (morning/afternoon/evening), each with a different random
 *   affirmation. Replaces any previously scheduled reminders and stores the new
 *   ids (delegates to the shared scheduler so the background refresh matches).
 * - `cancelAll` — cancels the scheduled daily reminders and clears the stored ids.
 */
export function useNotifications() {
  const requestPermissions = useCallback(async (): Promise<PermissionResult> => {
    // iOS only ever shows the native permission dialog once. After the user
    // denies it, requestPermissionsAsync() resolves to "denied" immediately
    // with canAskAgain === false and no dialog — so we must check first and
    // signal that case to the caller instead of pretending we asked.
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') {
      return { granted: true, canAskAgain: current.canAskAgain };
    }
    if (current.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      return { granted: requested.status === 'granted', canAskAgain: requested.canAskAgain };
    }
    // Previously denied: the dialog won't appear again. Caller should send the
    // user to system Settings.
    return { granted: false, canAskAgain: false };
  }, []);

  // Cancel only our tracked daily reminders (not vault/session notifications).
  const cancelAll = useCallback(async () => {
    const ids = useAppStore.getState().notificationIds;
    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
    );
    useAppStore.getState().setNotificationIds([]);
    useAppStore.getState().setLastRescheduledAt(null);
  }, []);

  // Schedule (or re-schedule) the daily reminders. Each time slot gets a
  // DIFFERENT random affirmation drawn from the user's selected goals, so the
  // text is fresh from the very first setup — pass explicit `bodies` only when
  // you need specific text. The actual scheduling, cancellation of the previous
  // reminders, and store/timestamp bookkeeping live in the shared scheduler
  // module so the background task can reuse identical logic.
  const scheduleReminders = useCallback(
    (times: ReminderTime[], bodies?: string[]) => rescheduleViaStore(times, bodies),
    [],
  );

  // Schedules a one-off notification to fire when a focus session ends, so
  // completion is announced even if the app is backgrounded by then.
  // `seconds` is the time from now until the session ends.
  const scheduleSessionCompletion = useCallback(async (seconds: number, minutes: number) => {
    await ensureSessionChannel();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Focus session complete! 🎉',
        body: `You completed a ${minutes}-minute focus session. Great work!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        repeats: false,
        channelId: SESSION_CHANNEL_ID,
      },
    });

    return id;
  }, []);

  // Cancels a previously scheduled session-completion notification (pause,
  // cancel, or normal in-app completion all call this).
  const cancelSessionCompletion = useCallback(async (notificationId: string | null) => {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {}
  }, []);

  // Schedules the one-off "your vault is ready" alert to fire at the exact
  // unlock datetime, so the user is nudged even if the app is closed. Returns
  // the notification id to store on the vault for later cancellation.
  const scheduleVaultUnlock = useCallback(async (unlockDate: Date) => {
    await ensureVaultChannel();

    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your vault is ready! 🔓',
        body: 'A message from your past self is waiting to be opened.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: unlockDate,
        channelId: VAULT_CHANNEL_ID,
      },
    });
  }, []);

  // Cancels a vault's scheduled unlock notification (called when the vault is
  // opened, so we don't nudge the user about something they've already seen).
  const cancelVaultUnlock = useCallback(async (notificationId: string | null | undefined) => {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {}
  }, []);

  return {
    requestPermissions,
    scheduleReminders,
    cancelAll,
    scheduleSessionCompletion,
    cancelSessionCompletion,
    scheduleVaultUnlock,
    cancelVaultUnlock,
  };
}

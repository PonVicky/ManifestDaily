import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/useAppStore';

type ReminderTime = 'morning' | 'afternoon' | 'evening';

// When each reminder fires, as a 24h local time.
const REMINDER_TIMES: Record<ReminderTime, { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 0 }, // 8:00 AM
  afternoon: { hour: 14, minute: 0 }, // 2:00 PM
  evening: { hour: 20, minute: 0 }, // 8:00 PM
};

const ANDROID_CHANNEL_ID = 'daily-reminders';
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

// Android requires an explicit channel for scheduled notifications to deliver.
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

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
 * Daily affirmation reminders, backed by expo-notifications.
 *
 * - `requestPermissions` — asks for notification permission (no-op if already granted).
 * - `scheduleDaily` — schedules one repeating daily reminder at the time that
 *   matches the user's chosen `reminderTime`, using today's affirmation as the
 *   body. Replaces any previously scheduled reminder and stores the new id.
 * - `cancelAll` — cancels all scheduled reminders and clears the stored id.
 */
export function useNotifications() {
  const requestPermissions = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const { status: requested } = await Notifications.requestPermissionsAsync();
    return requested === 'granted';
  }, []);

  const cancelAll = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    useAppStore.getState().setNotificationId(null);
  }, []);

  const scheduleDaily = useCallback(
    async (reminderTime: ReminderTime) => {
      // Replace any existing schedule so we never stack duplicate reminders.
      await cancelAll();
      await ensureAndroidChannel();

      const { hour, minute } = REMINDER_TIMES[reminderTime];
      const body = useAppStore.getState().currentAffirmation();

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your daily affirmation ✦',
          body,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: ANDROID_CHANNEL_ID,
        },
      });

      useAppStore.getState().setNotificationId(id);
      return id;
    },
    [cancelAll],
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
    scheduleDaily,
    cancelAll,
    scheduleSessionCompletion,
    cancelSessionCompletion,
    scheduleVaultUnlock,
    cancelVaultUnlock,
  };
}

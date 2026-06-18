import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { GoalId, ReminderTime, affirmationPool } from '../constants/data';
import { useAppStore } from '../store/useAppStore';

/**
 * Daily-affirmation reminder scheduling, shared by the foreground (Zustand
 * store) and background (raw AsyncStorage) code paths.
 *
 * The problem this solves: a daily-repeating notification freezes its body at
 * schedule time, so every day shows the same affirmation forever. To keep the
 * text fresh we re-create the schedule once a day with new random affirmations,
 * driven by whichever trigger fires first:
 *   - a once-daily `expo-background-task` (best-effort; never guaranteed on iOS)
 *   - the app coming to the foreground (the iOS safety net)
 *   - the user changing their goals or reminder times in settings
 *
 * The background task runs in a separate JS context with no live Zustand store,
 * so it reads and writes the persisted store blob in AsyncStorage directly.
 */

// 24h local time each reminder fires.
export const REMINDER_TIMES: Record<ReminderTime, { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 0 }, // 8:00 AM
  afternoon: { hour: 14, minute: 0 }, // 2:00 PM
  evening: { hour: 20, minute: 0 }, // 8:00 PM
};

export const ANDROID_CHANNEL_ID = 'daily-reminders';

// Refresh the affirmation text at most once per ~day. Used as a throttle by
// both the foreground trigger and the background task so that however often the
// OS fires them, the text changes roughly daily (and never thrashes).
export const RESCHEDULE_INTERVAL_MS = 23 * 60 * 60 * 1000;

// expo-task-manager task identifier for the daily refresh.
export const DAILY_REMINDER_TASK = 'daily-affirmation-reschedule';

// The key Zustand persists the store under — MUST match the `name` passed to
// `persist(...)` in store/useAppStore.ts. The background task reads/writes this
// blob directly because the store isn't available in the background context.
const PERSIST_KEY = 'manifest-store';

// Android requires an explicit channel for scheduled notifications to deliver.
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Pick `count` distinct random affirmations from the combined pool of `goals`,
// so each reminder slot (morning/afternoon/evening) shows different text.
// `affirmationPool` already de-duplicates, so the picks are distinct unless the
// pool is smaller than `count` (never the case with the built-in sets), in
// which case it wraps and allows a repeat.
export function pickAffirmations(goals: GoalId[], count: number): string[] {
  const pool = affirmationPool(goals);
  if (pool.length === 0) return [];
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

// Schedule one repeating daily reminder per time, returning the new ids. Pure
// mechanics with no store/storage access — shared by both reschedule paths.
// `bodies[i]` is the affirmation text for `times[i]`.
async function scheduleReminderNotifications(
  times: ReminderTime[],
  bodies: string[],
): Promise<string[]> {
  await ensureAndroidChannel();
  const ids: string[] = [];
  for (let i = 0; i < times.length; i++) {
    const { hour, minute } = REMINDER_TIMES[times[i]];
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your daily affirmation ✦',
        body: bodies[i],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    ids.push(id);
  }
  return ids;
}

async function cancelReminderIds(ids: string[]) {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
}

// Core reschedule: cancel the old reminder ids, then schedule a fresh daily
// reminder for each time with a different random affirmation (or the supplied
// `bodies`). Returns the new ids. Persists nothing — callers decide where the
// ids/timestamp go (live store vs raw AsyncStorage blob).
async function rebuildReminders(
  times: ReminderTime[],
  goals: GoalId[],
  oldIds: string[],
  bodies?: string[],
): Promise<string[]> {
  await cancelReminderIds(oldIds);
  if (times.length === 0) return [];
  const texts =
    bodies && bodies.length === times.length ? bodies : pickAffirmations(goals, times.length);
  return scheduleReminderNotifications(times, texts);
}

// ---------------------------------------------------------------------------
// Foreground path — driven by the live Zustand store (the source of truth while
// the app is running).
// ---------------------------------------------------------------------------

/**
 * Reschedule using the live store. Used by `useNotifications.scheduleReminders`
 * (onboarding / settings toggle), goal & reminder-time changes, and the
 * AppState safety net. Pass `times` to schedule a specific set; otherwise the
 * store's current `reminderTimes` are used. Picks fresh random affirmations
 * unless explicit `bodies` are supplied.
 */
export async function rescheduleViaStore(
  times?: ReminderTime[],
  bodies?: string[],
): Promise<string[]> {
  const state = useAppStore.getState();
  const reminderTimes = times ?? state.reminderTimes;
  const ids = await rebuildReminders(
    reminderTimes,
    state.selectedGoals,
    state.notificationIds,
    bodies,
  );
  state.setNotificationIds(ids);
  state.setLastRescheduledAt(Date.now());
  return ids;
}

// ---------------------------------------------------------------------------
// Background path — reads/writes the persisted store blob in AsyncStorage
// directly, since there's no live store in the background JS context.
// ---------------------------------------------------------------------------

interface PersistedReminderState {
  reminderTimes: ReminderTime[];
  selectedGoals: GoalId[];
  notificationIds: string[];
  lastRescheduledAt: number | null;
}

async function readPersisted(): Promise<{ raw: any; state: PersistedReminderState } | null> {
  const json = await AsyncStorage.getItem(PERSIST_KEY);
  if (!json) return null;
  try {
    const raw = JSON.parse(json);
    const s = raw?.state ?? {};
    return {
      raw,
      state: {
        reminderTimes: Array.isArray(s.reminderTimes) ? s.reminderTimes : [],
        selectedGoals: Array.isArray(s.selectedGoals) ? s.selectedGoals : [],
        notificationIds: Array.isArray(s.notificationIds) ? s.notificationIds : [],
        lastRescheduledAt: typeof s.lastRescheduledAt === 'number' ? s.lastRescheduledAt : null,
      },
    };
  } catch {
    return null;
  }
}

// Read-modify-write the persisted blob so we only touch the reminder bookkeeping
// and leave every other persisted field intact.
async function writePersisted(raw: any, notificationIds: string[], lastRescheduledAt: number) {
  const next = { ...raw, state: { ...raw.state, notificationIds, lastRescheduledAt } };
  await AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(next));
}

/**
 * Background reschedule entry point. Reads everything from AsyncStorage,
 * refreshes the affirmation text (throttled to ~once a day), and writes the new
 * ids + timestamp back so the next app launch rehydrates the correct ids.
 * Returns true if it rescheduled. Never resurrects reminders the user turned off.
 */
export async function rescheduleFromStorage(): Promise<boolean> {
  const persisted = await readPersisted();
  if (!persisted) return false;
  const { raw, state } = persisted;

  // Reminders off (none scheduled) — leave them off.
  if (state.reminderTimes.length === 0 || state.notificationIds.length === 0) return false;

  // Refresh at most once per ~day, even if the OS fires the task more often.
  if (state.lastRescheduledAt && Date.now() - state.lastRescheduledAt < RESCHEDULE_INTERVAL_MS) {
    return false;
  }

  const ids = await rebuildReminders(state.reminderTimes, state.selectedGoals, state.notificationIds);
  await writePersisted(raw, ids, Date.now());
  return true;
}

/**
 * Foreground safety net, called on cold launch and whenever the app becomes
 * active. First it adopts whatever the background task last wrote (it ran while
 * the store was suspended), so the in-memory store and AsyncStorage agree before
 * any cancel/reschedule targets the *real* scheduled notifications. Then, if
 * reminders are on and it's been >~23h since the last refresh, it refreshes the
 * affirmation text.
 */
export async function maybeRescheduleOnForeground(): Promise<void> {
  const persisted = await readPersisted();
  if (persisted) {
    const { notificationIds, lastRescheduledAt } = persisted.state;
    const store = useAppStore.getState();
    if (notificationIds.join('|') !== store.notificationIds.join('|')) {
      store.setNotificationIds(notificationIds);
    }
    if (lastRescheduledAt !== store.lastRescheduledAt) {
      store.setLastRescheduledAt(lastRescheduledAt);
    }
  }

  const { notificationIds, lastRescheduledAt, reminderTimes } = useAppStore.getState();
  if (notificationIds.length === 0) return; // reminders off
  if (lastRescheduledAt && Date.now() - lastRescheduledAt < RESCHEDULE_INTERVAL_MS) return;
  await rescheduleViaStore(reminderTimes);
}

// ---------------------------------------------------------------------------
// Background task registration. The task is defined at module scope so it's
// registered the moment this module is imported (required by expo-task-manager).
// ---------------------------------------------------------------------------

TaskManager.defineTask(DAILY_REMINDER_TASK, async () => {
  try {
    await rescheduleFromStorage();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Register the once-daily background refresh. iOS treats `minimumInterval` as a
 * lower bound and may run the task less often (or never) — the AppState trigger
 * is the safety net. Safe to call on every launch; if already registered it's a
 * no-op, and registration failures never block startup.
 */
export async function registerDailyReminderTask(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    if (await TaskManager.isTaskRegisteredAsync(DAILY_REMINDER_TASK)) return;
    await BackgroundTask.registerTaskAsync(DAILY_REMINDER_TASK, {
      minimumInterval: 60 * 12, // minutes — the throttle above keeps it ~daily
    });
  } catch {
    // Best-effort: never block app startup on background scheduling.
  }
}

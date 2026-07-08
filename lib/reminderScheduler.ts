import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { GoalId, ReminderTime, affirmationPool } from '../constants/data';
import { useAppStore, computeStreakFromDays } from '../store/useAppStore';

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
  morning: { hour: 11, minute: 11 }, // 11:11 AM
  afternoon: { hour: 14, minute: 0 }, // 2:00 PM
  evening: { hour: 20, minute: 0 }, // 8:00 PM
};

export const ANDROID_CHANNEL_ID = 'daily-reminders';

// Title shared by every daily-reminder notification. It doubles as the marker we
// use to find *all* of our reminders in the OS schedule (tracked or orphaned)
// so a reschedule can sweep duplicates rather than trusting the stored id list.
// It must stay distinct from the session/vault notification titles.
export const REMINDER_TITLE = 'Your daily affirmation ✦';

// Separate category for the "don't lose your streak" nudge. Its own channel and
// its own unique title marker (kept distinct from REMINDER_TITLE / session /
// vault titles) so it can be found and cancelled without disturbing the others.
export const STREAK_CHANNEL_ID = 'streak-reminders';
export const STREAK_TITLE = "Don't break your streak 🔥";

// Local hour the streak nudge fires — 10pm, ~2h before the midnight day
// boundary, so the user still has time to open the app and keep the streak.
const STREAK_REMINDER_HOUR = 22;

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
        title: REMINDER_TITLE,
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

// Identifiers of EVERY daily-reminder currently scheduled in the OS — matched by
// title, so this catches orphans (notifications the store no longer tracks,
// left behind by an earlier concurrent reschedule) as well as tracked ones.
// Deliberately does not match the focus-session or vault-unlock notifications,
// which carry different titles.
async function scheduledReminderIds(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((n) => n.content.title === REMINDER_TITLE).map((n) => n.identifier);
}

// How many daily reminders the OS actually has scheduled right now. Used to
// detect duplicates (more than expected) so we can self-heal.
export async function countScheduledReminders(): Promise<number> {
  return (await scheduledReminderIds()).length;
}

// Cancel every daily reminder in the OS schedule (tracked or orphaned). Leaves
// session/vault notifications untouched. Exported so turning reminders off also
// sweeps up any duplicates rather than only the ids the store happens to track.
export async function cancelAllReminderNotifications(): Promise<void> {
  const ids = await scheduledReminderIds();
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
}

// Serializes reschedules within this JS context. Without it, two overlapping
// reschedules (cold-launch + AppState 'active', say) can each schedule a set and
// the last writer orphans the other's notifications — the root cause of the
// duplicate reminders. Chaining guarantees each read→cancel→schedule→persist
// cycle runs to completion before the next begins.
let rescheduleChain: Promise<unknown> = Promise.resolve();
function withRescheduleLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = rescheduleChain.then(fn, fn);
  // Keep the chain alive whether fn resolves or rejects, without leaking the
  // rejection to an unhandled-rejection warning.
  rescheduleChain = run.then(
    () => {},
    () => {},
  );
  return run;
}

// Core reschedule: sweep away EVERY existing daily reminder (so duplicates can
// never accumulate), then schedule a fresh daily reminder for each time with a
// different random affirmation (or the supplied `bodies`). Returns the new ids.
// Persists nothing — callers decide where the ids/timestamp go (live store vs
// raw AsyncStorage blob).
async function rebuildReminders(
  times: ReminderTime[],
  goals: GoalId[],
  bodies?: string[],
): Promise<string[]> {
  await cancelAllReminderNotifications();
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
  return withRescheduleLock(async () => {
    const state = useAppStore.getState();
    const reminderTimes = times ?? state.reminderTimes;
    const ids = await rebuildReminders(reminderTimes, state.selectedGoals, bodies);
    useAppStore.getState().setNotificationIds(ids);
    useAppStore.getState().setLastRescheduledAt(Date.now());
    return ids;
  });
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

  const ids = await withRescheduleLock(() =>
    rebuildReminders(state.reminderTimes, state.selectedGoals),
  );
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

  // Self-heal: if the OS has a different number of reminders scheduled than we
  // expect — duplicates left by an earlier race, or some dropped by the OS —
  // rebuild now regardless of the daily throttle. rescheduleViaStore sweeps all
  // reminders first, so this collapses any duplicates back to exactly one per
  // time. Guarded on a non-empty reminderTimes so we never wipe reminders that
  // are on while the times list is momentarily empty.
  if (reminderTimes.length > 0) {
    const scheduledCount = await countScheduledReminders();
    if (scheduledCount !== reminderTimes.length) {
      await rescheduleViaStore(reminderTimes);
      return;
    }
  }

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

// ---------------------------------------------------------------------------
// Streak-saver notification — a single one-off nudge scheduled for tomorrow
// night, rescheduled on every app open. Because opening the app pushes it to
// the next night, it only ever actually fires on a day the user never opened
// the app — i.e. right before they'd lose their streak. Entirely best-effort:
// no permission prompt and no settings toggle, so it silently no-ops if the
// user has never granted notification permission.
// ---------------------------------------------------------------------------

async function ensureStreakChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(STREAK_CHANNEL_ID, {
      name: 'Streak reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Ids of every streak nudge currently scheduled in the OS, matched by title so
// we never touch the affirmation/session/vault notifications.
async function scheduledStreakIds(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((n) => n.content.title === STREAK_TITLE).map((n) => n.identifier);
}

export async function cancelStreakReminders(): Promise<void> {
  const ids = await scheduledStreakIds();
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
}

function streakReminderBody(streak: number): string {
  if (streak <= 1) {
    return 'You haven’t opened Manifest today. Take one mindful minute before midnight to keep your streak alive.';
  }
  return `You haven’t opened Manifest today. Take one mindful minute before midnight to keep your ${streak}-day streak alive.`;
}

/**
 * (Re)schedule the streak-saver nudge for tomorrow at 10pm. Called on every app
 * open: today is already safe (the user just opened the app), so the only day
 * at risk is tomorrow — and if they open tomorrow before 10pm this simply gets
 * cancelled and re-pointed to the following night. Best-effort; swallows every
 * error (including "no notification permission").
 */
export async function scheduleStreakReminder(): Promise<void> {
  // Serialized on the same lock as the reminder reschedules: this runs on both
  // cold launch and every AppState 'active', and two overlapping cancel→schedule
  // passes could otherwise interleave and leave a duplicate nudge behind.
  return withRescheduleLock(async () => {
    try {
      const { streakDays } = useAppStore.getState();
      const { currentStreak } = computeStreakFromDays(new Set(streakDays));

      // Always clear the pending nudge first so we never stack duplicates.
      await cancelStreakReminders();

      // No streak yet — nothing to protect, so leave it cancelled.
      if (currentStreak <= 0) return;

      await ensureStreakChannel();

      const fireAt = new Date();
      fireAt.setDate(fireAt.getDate() + 1);
      fireAt.setHours(STREAK_REMINDER_HOUR, 0, 0, 0);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: STREAK_TITLE,
          body: streakReminderBody(currentStreak),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: STREAK_CHANNEL_ID,
        },
      });
    } catch {
      // Best-effort: never surface a scheduling/permission failure into the UI.
    }
  });
}

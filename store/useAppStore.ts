import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalId, SoundId, FocusDuration, ReminderTime, SOUNDS, affirmationPool, goalIdForAffirmation, sortReminderTimes } from '../constants/data';
import { ThemeKey } from '../constants/theme';

export interface Vault {
  id: string;
  title: string;
  message: string;
  created: string;
  unlock: string;
  opened?: boolean;
  // expo-notifications id for the scheduled "vault is ready" alert (if any).
  notificationId?: string;
}

// A user-authored affirmation. Stored alongside the built-in pool and shown in
// the Reflect feed just like a built-in one. `category` is one of the six goals
// so it can carry the same ✦ category tag; `isCustom` flags it for the
// "Custom" filter (and any custom-only treatment later).
export interface CustomAffirmation {
  id: string;
  text: string;
  category: GoalId;
  isCustom: true;
}

// A single completed session, recorded from real usage. `type` is omitted
// for older persisted entries, which were always focus sessions.
export interface SessionLog {
  id: string;
  minutes: FocusDuration;
  sound: SoundId | null;
  date: string; // ISO timestamp of completion
  type?: 'focus' | 'breathing';
}

// Breathing sessions show up in the Recent list but — unlike focus sessions —
// don't count toward the day streak, activity calendar, or progress stats.
function isFocusSession(s: SessionLog): boolean {
  return s.type !== 'breathing';
}

// Display-ready shape for the "Recent" list in the Focus screen.
export interface RecentSession {
  duration: FocusDuration;
  sound: string;
  when: string;
}

const DAY_MS = 86_400_000;

// Use Date.UTC so day boundaries land on exact 24h multiples — local
// midnight via `new Date(y,m,d)` can drift by an hour across DST changes,
// throwing off the day-difference math in relativeWhen below.
function startOfDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Calendar-month view of activity for the "Month dots" display: which days
// of the current month have a logged session, plus enough metadata to lay
// out a 7-column grid aligned to weekdays.
export interface MonthActivity {
  monthLabel: string;
  daysInMonth: number;
  firstWeekday: number; // day-of-week (0 = Sunday) that day 1 falls on
  activeDays: Set<number>;
  today: number;
}

// Exported so components can compute this with `useMemo` off the stable
// `sessions` array, instead of via a store selector — a selector that calls
// this directly would return a fresh object/Set every render and trigger an
// infinite re-render loop.
export function buildMonthActivity(sessions: SessionLog[]): MonthActivity {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const activeDays = new Set<number>();
  for (const s of sessions) {
    if (!isFocusSession(s)) continue;
    const d = new Date(s.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      activeDays.add(d.getDate());
    }
  }

  return { monthLabel: `${MONTHS_FULL[month]} ${year}`, daysInMonth, firstWeekday, activeDays, today: now.getDate() };
}

const SOUND_LABELS: Record<SoundId, string> = SOUNDS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.label }),
  {} as Record<SoundId, string>,
);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Turn a session timestamp into a human "when" label, derived from real dates.
function relativeWhen(iso: string): string {
  const d = new Date(iso);
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  if (daysAgo <= 0) return `Today, ${formatTime(d)}`;
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return WEEKDAYS[d.getDay()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// Day-streak counts worth celebrating with a stronger haptic the moment they
// are first reached.
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 100, 365];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

// Streak data derived from real session dates: how many consecutive calendar
// days (ending today, with a one-day grace period so the streak doesn't drop
// before today's session is logged) have at least one session, and the
// longest such run ever found in the session history. `isMilestone` is true
// when the current streak lands exactly on a celebrated milestone.
export function computeStreak(sessions: SessionLog[]): { currentStreak: number; longestStreak: number; isMilestone: boolean } {
  const focusSessions = sessions.filter(isFocusSession);
  if (focusSessions.length === 0) return { currentStreak: 0, longestStreak: 0, isMilestone: false };

  const days = new Set<number>();
  for (const s of focusSessions) {
    days.add(startOfDay(new Date(s.date)));
  }

  const today = startOfDay(new Date());
  const yesterday = today - DAY_MS;

  let currentStreak = 0;
  if (days.has(today) || days.has(yesterday)) {
    let cursor = days.has(today) ? today : yesterday;
    while (days.has(cursor)) {
      currentStreak += 1;
      cursor -= DAY_MS;
    }
  }

  const sortedDays = [...days].sort((a, b) => a - b);
  let longestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of sortedDays) {
    run = prev !== null && day - prev === DAY_MS ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = day;
  }

  return { currentStreak, longestStreak, isMilestone: isStreakMilestone(currentStreak) };
}

// Derive the "most consistent" insight from real session timestamps using the
// last 10 sessions. Returns null when there's nothing to say yet.
function buildInsight(sessions: SessionLog[]): string | null {
  // Breathing sessions don't count toward progress stats, so exclude them here
  // too — otherwise this "last N sessions" count disagrees with the Sessions stat.
  const focusSessions = sessions.filter(isFocusSession);
  if (focusSessions.length === 0) return null;
  const recent = [...focusSessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  const buckets = { mornings: 0, afternoons: 0, evenings: 0 };
  for (const s of recent) {
    const h = new Date(s.date).getHours();
    if (h < 12) buckets.mornings += 1;
    else if (h < 17) buckets.afternoons += 1;
    else buckets.evenings += 1;
  }
  const [topLabel, topCount] = (
    Object.entries(buckets) as [keyof typeof buckets, number][]
  ).sort((a, b) => b[1] - a[1])[0];
  return `You're most consistent in the ${topLabel} — ${topCount} of your last ${recent.length} sessions.`;
}

// Date of birth captured in onboarding. Stored as plain numbers (month is
// 1-12) so it survives JSON persistence cleanly and is easy to format.
export interface Dob {
  day: number;
  month: number; // 1-12
  year: number;
}

interface AppState {
  // Onboarding
  hasOnboarded: boolean;
  // ISO timestamp set when completeOnboarding() runs; drives the soft
  // paywall grace period.
  onboardingCompletedAt: string | null;
  userName: string;
  userDob: Dob | null;
  selectedGoals: GoalId[];
  // One or more times of day the user wants to be reminded, chosen in
  // onboarding. Empty means none picked yet.
  reminderTimes: ReminderTime[];
  // Identifiers of the currently scheduled daily reminders (one per time in
  // `reminderTimes`). Empty when reminders are off.
  notificationIds: string[];
  // Unix ms of the last time the daily reminders were (re)scheduled with fresh
  // affirmation text. Drives the once-a-day refresh throttle shared by the
  // background task and the foreground AppState trigger. null = never scheduled.
  lastRescheduledAt: number | null;

  // Entitlements
  // Synced from RevenueCat (checkPremiumStatus) on app launch and after
  // purchase/restore.
  isPremium: boolean;
  // Session-only: true when the user explicitly closes the paywall without
  // purchasing. Resets to false on every app restart (not persisted).
  paywallDismissed: boolean;

  // Home
  affirmationIndex: number;
  savedAffirmations: string[];
  // User-authored affirmations, newest first.
  customAffirmations: CustomAffirmation[];
  darkMode: boolean;
  themeKey: ThemeKey;

  // Focus
  focusMinutes: FocusDuration;
  selectedSound: SoundId | null;

  // Progress
  sessions: SessionLog[];
  totalSessions: number;
  focusHours: number;
  bestStreak: number;

  // Vault
  vaults: Vault[];

  // Focus session timer — survives backgrounding by tracking the absolute
  // end time (Unix ms) rather than elapsed/remaining seconds. Both are null
  // when no focus session is currently running.
  activeSessionEndTime: number | null;
  activeSessionNotificationId: string | null;

  // A session that was dismissed (swiped away) mid-run, paused rather than
  // discarded. The Focus tab offers a "Continue session" button while this
  // is set; null when there's nothing to resume.
  pausedSession: { remainingMs: number; minutes: FocusDuration; sound: SoundId | null } | null;

  // Computed
  currentAffirmation: () => string;
  recentSessions: () => RecentSession[];
  focusInsight: () => string | null;
  // Current consecutive-day streak, derived from `sessions` on the fly so it
  // naturally resets to 0 when a day is missed without any session being logged.
  streak: () => number;

  // Actions
  setName: (name: string) => void;
  setDob: (dob: Dob) => void;
  setGoals: (goals: GoalId[]) => void;
  setReminders: (times: ReminderTime[]) => void;
  setNotificationIds: (ids: string[]) => void;
  setLastRescheduledAt: (ts: number | null) => void;
  completeOnboarding: () => void;
  setPremium: (value: boolean) => void;
  dismissPaywall: () => void;
  nextAffirmation: () => void;
  prevAffirmation: () => void;
  toggleSaveAffirmation: (text: string) => void;
  addCustomAffirmation: (text: string, category: GoalId) => void;
  updateCustomAffirmation: (id: string, text: string, category: GoalId) => void;
  deleteCustomAffirmation: (id: string) => void;
  setFocusMinutes: (min: FocusDuration) => void;
  setSound: (sound: SoundId | null) => void;
  toggleDarkMode: () => void;
  setThemeKey: (key: ThemeKey) => void;
  logSession: (minutes: FocusDuration) => void;
  logBreathingSession: (seconds: number) => void;
  addVault: (vault: Omit<Vault, 'id'>) => void;
  markVaultOpened: (id: string) => void;
  deleteVault: (id: string) => void;
  setActiveSession: (endTime: number, notificationId: string | null) => void;
  clearActiveSession: () => void;
  setPausedSession: (session: { remainingMs: number; minutes: FocusDuration; sound: SoundId | null }) => void;
  clearPausedSession: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      onboardingCompletedAt: null,
      isPremium: false,
      paywallDismissed: false,
      userName: '',
      userDob: null,
      selectedGoals: [],
      reminderTimes: [],
      notificationIds: [],
      lastRescheduledAt: null,
      affirmationIndex: 0,
      savedAffirmations: [],
      customAffirmations: [],
      darkMode: false,
      themeKey: 'cream' as ThemeKey,
      focusMinutes: 25,
      selectedSound: null,
      sessions: [],
      totalSessions: 0,
      focusHours: 0,
      bestStreak: 0,
      vaults: [],
      activeSessionEndTime: null,
      activeSessionNotificationId: null,
      pausedSession: null,

      currentAffirmation: () => {
        const { selectedGoals, affirmationIndex } = get();
        // Pool affirmations from ALL selected goals so multi-goal users see
        // every chosen goal's affirmations rotate together.
        const pool = affirmationPool(selectedGoals);
        return pool[affirmationIndex % pool.length];
      },

      recentSessions: () => {
        const { sessions } = get();
        return [...sessions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
          .map((s) => ({
            duration: s.minutes,
            sound: s.type === 'breathing' ? 'Breathing' : s.sound ? SOUND_LABELS[s.sound] : 'Silent',
            when: relativeWhen(s.date),
          }));
      },

      focusInsight: () => buildInsight(get().sessions),

      streak: () => computeStreak(get().sessions).currentStreak,

      setName: (name) => set({ userName: name }),

      setDob: (dob) => set({ userDob: dob }),

      setGoals: (goals) => set({ selectedGoals: goals, affirmationIndex: 0 }),

      setReminders: (times) => set({ reminderTimes: sortReminderTimes(times) }),

      setNotificationIds: (ids) => set({ notificationIds: ids }),

      setLastRescheduledAt: (ts) => set({ lastRescheduledAt: ts }),

      completeOnboarding: () => set({ hasOnboarded: true, onboardingCompletedAt: new Date().toISOString() }),

      setPremium: (value) => set({ isPremium: value }),

      dismissPaywall: () => set({ paywallDismissed: true }),

      nextAffirmation: () =>
        set((state) => {
          // Cycle across the same combined pool currentAffirmation() reads from.
          const len = affirmationPool(state.selectedGoals).length;
          return { affirmationIndex: (state.affirmationIndex + 1) % len };
        }),

      prevAffirmation: () =>
        set((state) => {
          const len = affirmationPool(state.selectedGoals).length;
          return { affirmationIndex: (state.affirmationIndex - 1 + len) % len };
        }),

      toggleSaveAffirmation: (text) =>
        set((state) => {
          const saved = state.savedAffirmations.includes(text)
            ? state.savedAffirmations.filter((a) => a !== text)
            : [...state.savedAffirmations, text];
          return { savedAffirmations: saved };
        }),

      addCustomAffirmation: (text, category) =>
        set((state) => ({
          customAffirmations: [
            { id: Date.now().toString(), text: text.trim(), category, isCustom: true },
            ...state.customAffirmations,
          ],
        })),

      updateCustomAffirmation: (id, text, category) =>
        set((state) => {
          const target = state.customAffirmations.find((c) => c.id === id);
          const newText = text.trim();
          const customAffirmations = state.customAffirmations.map((c) =>
            c.id === id ? { ...c, text: newText, category } : c,
          );
          let savedAffirmations = state.savedAffirmations;
          // Likes are keyed by text. If the text changed and the old one was
          // liked, carry the like over to the new text (dropping the orphaned
          // old one unless something else still uses it).
          if (target && target.text !== newText && savedAffirmations.includes(target.text)) {
            const oldStillUsed =
              customAffirmations.some((c) => c.text === target.text) ||
              goalIdForAffirmation(target.text) !== undefined;
            if (!oldStillUsed) {
              savedAffirmations = savedAffirmations.filter((t) => t !== target.text);
            }
            if (!savedAffirmations.includes(newText)) {
              savedAffirmations = [...savedAffirmations, newText];
            }
          }
          return { customAffirmations, savedAffirmations };
        }),

      deleteCustomAffirmation: (id) =>
        set((state) => {
          const target = state.customAffirmations.find((c) => c.id === id);
          const customAffirmations = state.customAffirmations.filter((c) => c.id !== id);
          let savedAffirmations = state.savedAffirmations;
          // Drop the orphaned like, unless a built-in or another custom
          // affirmation still has the same text.
          if (target) {
            const stillUsed =
              customAffirmations.some((c) => c.text === target.text) ||
              goalIdForAffirmation(target.text) !== undefined;
            if (!stillUsed) {
              savedAffirmations = savedAffirmations.filter((t) => t !== target.text);
            }
          }
          return { customAffirmations, savedAffirmations };
        }),

      setFocusMinutes: (min) => set({ focusMinutes: min }),

      setSound: (sound) => set({ selectedSound: sound }),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      setThemeKey: (key) => set({ themeKey: key }),

      logSession: (minutes) =>
        set((state) => {
          const session: SessionLog = {
            id: Date.now().toString(),
            minutes,
            sound: state.selectedSound,
            date: new Date().toISOString(),
          };
          const sessions = [session, ...state.sessions];
          const { currentStreak, longestStreak } = computeStreak(sessions);
          return {
            sessions,
            totalSessions: state.totalSessions + 1,
            focusHours: Math.round((state.focusHours + minutes / 60) * 100) / 100,
            bestStreak: Math.max(state.bestStreak, currentStreak, longestStreak),
          };
        }),

      // Recorded for the Recent list only — doesn't affect totalSessions,
      // focusHours, the day streak, or the activity calendar.
      logBreathingSession: (seconds) =>
        set((state) => {
          const session: SessionLog = {
            id: Date.now().toString(),
            minutes: Math.round((seconds / 60) * 10) / 10,
            sound: null,
            date: new Date().toISOString(),
            type: 'breathing',
          };
          return { sessions: [session, ...state.sessions] };
        }),

      addVault: (vault) =>
        set((state) => ({
          vaults: [{ ...vault, id: Date.now().toString() }, ...state.vaults],
        })),

      markVaultOpened: (id) =>
        set((state) => ({
          vaults: state.vaults.map((v) => (v.id === id ? { ...v, opened: true } : v)),
        })),

      deleteVault: (id) =>
        set((state) => ({
          vaults: state.vaults.filter((v) => v.id !== id),
        })),

      setActiveSession: (endTime, notificationId) =>
        set({ activeSessionEndTime: endTime, activeSessionNotificationId: notificationId }),

      clearActiveSession: () =>
        set({ activeSessionEndTime: null, activeSessionNotificationId: null }),

      setPausedSession: (session) => set({ pausedSession: session }),

      clearPausedSession: () => set({ pausedSession: null }),
    }),
    {
      name: 'manifest-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 12,
      // Safety net for future store-shape changes. Bump `version` and handle
      // older `persistedState` shapes here so existing users' data survives.
      // v2: no theme-picker UI ships yet, so force the intended default palette
      // ('cream') and clear any stale themeKey left in storage from theme dev.
      // v3: earlier builds seeded fake stats (streak/sessions/hours) and a
      // random activity heatmap. Wipe those so everyone starts from a clean,
      // real-data-only slate; user content (goals, affirmations, vaults) stays.
      // v4: the Activity card switched from an 18-week heatmap to a
      // calendar-month "dots" view, derived from `sessions` on the fly —
      // the old `activityData` grid is no longer part of the store shape.
      // v5/v6: `streak` is now derived on the fly from real session dates
      // (consecutive calendar days) instead of an incrementing counter.
      // Drop the old stored field and recompute `bestStreak` purely from
      // `sessions` — the old counter incremented per-session (not per-day),
      // so any previously stored value is inflated and must be discarded
      // rather than kept as a floor.
      // v7: adds end-time-based background tracking for the focus timer.
      // Existing installs have no in-flight session, so both fields start null.
      // v8: adds `pausedSession` for a focus session dismissed mid-run.
      // Existing installs have nothing paused.
      // v9: adds `isPremium` (synced from RevenueCat on launch) and
      // `onboardingCompletedAt` (drives the soft paywall grace period).
      // Existing installs start non-premium with no completion timestamp, so
      // the grace-period gate doesn't retroactively apply to them.
      // v10: adds `customAffirmations` (user-authored affirmations). Existing
      // installs start with none.
      // v11: reminders went from a single `reminderTime`/`notificationId` to
      // arrays (`reminderTimes`/`notificationIds`) so multiple daily times can
      // be scheduled. Wrap any existing single value into a one-element array.
      // v12: adds `lastRescheduledAt`, the timestamp driving the once-a-day
      // affirmation-text refresh. Start null so existing installs refresh on
      // their next foreground (or background task run), picking fresh random
      // text in place of whatever was frozen at original schedule time.
      migrate: (persistedState, version) => {
        const prev = (persistedState ?? {}) as Omit<Partial<AppState>, 'streak'> & {
          activityData?: unknown;
          streak?: number;
          reminderTime?: ReminderTime | null;
          notificationId?: string | null;
        };
        const cleaned: Omit<Partial<AppState>, 'streak'> & {
          activityData?: unknown;
          streak?: number;
          reminderTime?: ReminderTime | null;
          notificationId?: string | null;
        } = { ...prev, themeKey: 'cream' as ThemeKey };
        if (version < 3) {
          cleaned.streak = 0;
          cleaned.totalSessions = 0;
          cleaned.focusHours = 0;
          cleaned.bestStreak = 0;
          cleaned.sessions = [];
        }
        if (version < 4) {
          delete cleaned.activityData;
        }
        if (version < 6) {
          const { currentStreak, longestStreak } = computeStreak(cleaned.sessions ?? []);
          cleaned.bestStreak = Math.max(currentStreak, longestStreak);
          delete cleaned.streak;
        }
        if (version < 7) {
          cleaned.activeSessionEndTime = null;
          cleaned.activeSessionNotificationId = null;
        }
        if (version < 8) {
          cleaned.pausedSession = null;
        }
        if (version < 9) {
          cleaned.isPremium = false;
          cleaned.onboardingCompletedAt = null;
        }
        if (version < 10) {
          cleaned.customAffirmations = [];
        }
        if (version < 11) {
          cleaned.reminderTimes = cleaned.reminderTime ? [cleaned.reminderTime] : [];
          cleaned.notificationIds = cleaned.notificationId ? [cleaned.notificationId] : [];
          delete cleaned.reminderTime;
          delete cleaned.notificationId;
        }
        if (version < 12) {
          cleaned.lastRescheduledAt = null;
        }
        return cleaned as unknown as AppState;
      },
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        onboardingCompletedAt: state.onboardingCompletedAt,
        isPremium: state.isPremium,
        userName: state.userName,
        userDob: state.userDob,
        selectedGoals: state.selectedGoals,
        reminderTimes: state.reminderTimes,
        notificationIds: state.notificationIds,
        lastRescheduledAt: state.lastRescheduledAt,
        savedAffirmations: state.savedAffirmations,
        customAffirmations: state.customAffirmations,
        sessions: state.sessions,
        darkMode: state.darkMode,
        themeKey: state.themeKey,
        affirmationIndex: state.affirmationIndex,
        totalSessions: state.totalSessions,
        focusHours: state.focusHours,
        bestStreak: state.bestStreak,
        vaults: state.vaults,
        activeSessionEndTime: state.activeSessionEndTime,
        activeSessionNotificationId: state.activeSessionNotificationId,
        pausedSession: state.pausedSession,
      }),
    },
  ),
);

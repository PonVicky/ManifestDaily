import { useEffect, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { initRevenueCat, checkPremiumStatus } from '../src/lib/revenueCat';
import { registerDailyReminderTask, maybeRescheduleOnForeground, scheduleStreakReminder } from '../lib/reminderScheduler';
import { AnalyticsProvider } from '../lib/analytics';
import StreakBanner from '../components/ui/StreakBanner';

SplashScreen.preventAutoHideAsync();

// Tracks whether the persisted Zustand store has finished rehydrating from
// AsyncStorage. Until it has, `hasOnboarded` still holds its default value and
// must not drive navigation.
function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    // In case hydration completed between the initial state read and subscribing.
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}

// DEV: while working on onboarding, force the flow every launch.
// Set back to false to restore the normal one-time onboarding behavior.
const FORCE_ONBOARDING = false;

// DEV-ONLY: flip to `true` locally to walk past the hard paywall without a real
// or sandbox purchase (e.g. when testing the tabs in Expo Go, where RevenueCat
// is unavailable and `isPremium` is always false). Gated behind `__DEV__` so it
// is always `false` in a production build and can never ship a paywall bypass.
const DEV_BYPASS_PAYWALL = __DEV__ && false;

function NavigationGuard({ hydrated }: { hydrated: boolean }) {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded) && !FORCE_ONBOARDING;
  const isPremium = useAppStore((s) => s.isPremium);
  const segments = useSegments();
  const router = useRouter();

  // Hard paywall: once onboarding is complete, a non-premium user (no active
  // entitlement — including an active free trial, which RevenueCat reports as
  // premium) is sent to the paywall on every launch with no way to bypass it.
  // DEV_BYPASS_PAYWALL lets developers through; it is forced false in production.
  const needsPaywall = hasOnboarded && !isPremium && !DEV_BYPASS_PAYWALL;

  useEffect(() => {
    if (!hydrated) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const step = (segments as string[])[1];
    const onPaywall = inOnboarding && step === 'paywall';
    const onAllset = inOnboarding && step === 'allset';

    if (!hasOnboarded && !inOnboarding) {
      // Never onboarded: start the flow.
      router.replace('/(onboarding)/welcome');
    } else if (needsPaywall && !onPaywall) {
      // Onboarded but no active entitlement: hard-gate to the paywall, every
      // launch, with no way past it but to subscribe or restore.
      router.replace('/(onboarding)/paywall');
    } else if (hasOnboarded && inOnboarding && !needsPaywall && !onPaywall && !onAllset) {
      // Onboarded and entitled (just purchased/restored): leave the onboarding
      // stack for the app. The paywall and the "all set" celebration are
      // exempt — the purchase flow navigates through them explicitly (paywall →
      // allset → tabs) and must not be yanked straight to the tabs mid-way.
      router.replace('/(tabs)/');
    }
  }, [hydrated, hasOnboarded, needsPaywall, segments]);

  // If a focus session's end time has already passed, the app was
  // backgrounded/killed before the session screen could log it itself.
  // Log it now from the last-used focus settings and clear the stale state.
  useEffect(() => {
    if (!hydrated) return;

    const { activeSessionEndTime, activeSessionNotificationId, focusMinutes, clearActiveSession, logSession } =
      useAppStore.getState();

    if (activeSessionEndTime && activeSessionEndTime <= Date.now()) {
      if (activeSessionNotificationId) {
        Notifications.cancelScheduledNotificationAsync(activeSessionNotificationId).catch(() => { });
      }
      logSession(focusMinutes);
      clearActiveSession();
      Alert.alert(
        'Session ended while you were away',
        `Your ${focusMinutes}-minute focus session finished. Nice work!`,
      );
    }
  }, [hydrated]);

  return null;
}

export default function RootLayout() {
  const { theme, darkMode } = useTheme();
  const hydrated = useStoreHydrated();

  const [fontsLoaded, fontError] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });

  // Initialize RevenueCat and sync the Pro entitlement status once the
  // persisted store has hydrated.
  useEffect(() => {
    if (!hydrated) return;
    initRevenueCat();
    checkPremiumStatus().then((isPremium) => {
      useAppStore.getState().setPremium(isPremium);
    });
  }, [hydrated]);

  // Register the once-daily background task that refreshes the reminder
  // affirmation text. Best-effort and independent of hydration; the task itself
  // reads everything it needs straight from AsyncStorage when it fires.
  useEffect(() => {
    registerDailyReminderTask();
  }, []);

  // Foreground safety net for the daily refresh: iOS rarely runs background
  // tasks on schedule, so we also refresh the affirmation text whenever the app
  // becomes active — throttled to once per ~23h inside the scheduler. Needs the
  // store hydrated since it reconciles ids/timestamp against the live store.
  useEffect(() => {
    if (!hydrated) return;
    // Register today's app open toward the streak (keeps it alive without a
    // session, drops the pop-down banner on the first open of a new day) and
    // re-point the streak-saver nudge to tomorrow night. Gated on hasOnboarded
    // so onboarding launches don't start a streak or flash the banner.
    const runOpenCheckIn = () => {
      const s = useAppStore.getState();
      if (!s.hasOnboarded) return;
      s.checkInToday();
      scheduleStreakReminder();
    };
    runOpenCheckIn();
    maybeRescheduleOnForeground();
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      runOpenCheckIn();
      maybeRescheduleOnForeground();
    });
    return () => sub.remove();
  }, [hydrated]);

  const ready = (fontsLoaded || fontError) && hydrated;

  useEffect(() => {
    if (ready) {
      // During Fast Refresh the native splash screen may already be hidden /
      // unregistered for this view controller — that rejection is harmless,
      // so swallow it instead of letting it surface as an uncaught error.
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <AnalyticsProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <NavigationGuard hydrated={hydrated} />
            <Stack screenOptions={{ contentStyle: { backgroundColor: theme.bg } }}>
              <Stack.Screen
                name="(onboarding)"
                options={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: theme.bg } }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}
              />
              <Stack.Screen
                name="breathing"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: theme.bg },
                }}
              />
              <Stack.Screen
                name="session"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: theme.bg },
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: theme.bg },
                }}
              />
              <Stack.Screen
                name="affirmation-detail"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: theme.bg },
                }}
              />
              <Stack.Screen
                name="new-affirmation"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: theme.bg },
                }}
              />
            </Stack>
            <StreakBanner />
            <StatusBar style={darkMode ? 'light' : 'dark'} />
          </View>
        </SafeAreaProvider>
      </AnalyticsProvider>
    </GestureHandlerRootView>
  );
}

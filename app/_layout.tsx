import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
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

// Soft paywall: non-premium users get this long after completing onboarding
// before the tabs are gated behind the paywall screen on every launch.
const PAYWALL_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

function NavigationGuard({ hydrated }: { hydrated: boolean }) {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded) && !FORCE_ONBOARDING;
  const isPremium = useAppStore((s) => s.isPremium);
  const onboardingCompletedAt = useAppStore((s) => s.onboardingCompletedAt);
  const segments = useSegments();
  const router = useRouter();

  const gracePeriodElapsed =
    !!onboardingCompletedAt &&
    Date.now() - new Date(onboardingCompletedAt).getTime() > PAYWALL_GRACE_PERIOD_MS;
  const needsPaywall = hasOnboarded && !isPremium && gracePeriodElapsed;

  useEffect(() => {
    if (!hydrated) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const onPaywall = inOnboarding && (segments as string[])[1] === 'paywall';

    if (!hasOnboarded && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else if (needsPaywall && !onPaywall) {
      router.replace('/(onboarding)/paywall');
    } else if (hasOnboarded && inOnboarding && !needsPaywall) {
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
              name="saved-affirmations"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
                contentStyle: { backgroundColor: theme.bg },
              }}
            />
          </Stack>
          <StatusBar style={darkMode ? 'light' : 'dark'} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

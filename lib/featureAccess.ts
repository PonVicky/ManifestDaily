import { Platform } from 'react-native';
import type { Router } from 'expo-router';
import { trackEvent } from './analytics';

// Central free-vs-premium policy for the Android freemium (soft paywall) model.
//
// iOS is a hard paywall and must stay byte-for-byte identical: nothing is free
// there, `hasAccess()` is exactly `isPremium`, and NavigationGuard keeps
// hard-gating non-premium iOS users to the paywall at launch (so these checks
// are never reached by a non-premium iOS user outside the dev-only bypass).

export type FeatureKey =
  | 'homeFeed' // daily affirmation feed on Home
  | 'allCategories' // full affirmation category library (beyond the first goal)
  | 'customAffirmations' // unlimited user-written affirmations (free tier gets a small allowance)
  | 'focusTimer' // focus timer with the preset durations
  | 'customDurations' // custom-duration wheel on the Focus tab
  | 'ambientAudio' // rain/ocean/forest during focus sessions
  | 'vault'
  | 'progress' // streaks, activity calendar, stats tab
  | 'breathing'
  | 'multiSlotReminders' // more than one daily reminder slot
  | 'dataExport'
  | 'challenge'; // 21-day challenge entry (lands on the Focus tab)

// TODO(temporary): every feature is free on Android because Play Console
// products aren't wired up yet — the paywall would show fake fallback prices
// and a non-functional buy button. Revert this allow-list back to the real
// free tier once Play Console products are live and mapped to the `default2`
// offering in RevenueCat. iOS is unaffected (hasAccess() short-circuits above
// android-only checks).
const ANDROID_FREE_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  'homeFeed',
  'allCategories',
  'customAffirmations',
  'focusTimer',
  'customDurations',
  'ambientAudio',
  'vault',
  'progress',
  'breathing',
  'multiSlotReminders',
  'dataExport',
  'challenge',
]);

export function hasAccess(featureKey: FeatureKey, isPremium: boolean): boolean {
  if (Platform.OS !== 'android') return isPremium;
  return isPremium || ANDROID_FREE_FEATURES.has(featureKey);
}

// True when interacting with `featureKey` should bounce to the paywall instead
// of the feature. Deliberately hard-false on iOS: a non-premium user can only
// be inside the iOS app via the dev-only DEV_BYPASS_PAYWALL, and per-feature
// bounces there would break that testing path.
export function isGated(featureKey: FeatureKey, isPremium: boolean): boolean {
  return Platform.OS === 'android' && !hasAccess(featureKey, isPremium);
}

// Android free tier: up to this many user-written affirmations; creating the
// next one bounces to the paywall. Unlimited for premium (iOS is premium-only).
export const FREE_CUSTOM_AFFIRMATION_LIMIT = 3;

export function canCreateCustomAffirmation(existingCount: number, isPremium: boolean): boolean {
  // Never gates on iOS, mirroring isGated(): every iOS user inside the app is
  // premium (or the dev-only bypass, which must keep working untouched).
  if (Platform.OS !== 'android') return true;
  // TODO(temporary): unlimited on Android too, same reason as
  // ANDROID_FREE_FEATURES above — Play Console products aren't wired up yet.
  // Revert this line to `return isPremium || existingCount < FREE_CUSTOM_AFFIRMATION_LIMIT;`
  // once Play Console products are live and mapped to `default2` in RevenueCat.
  return true;
}

// Route for feature-triggered paywall visits. `context: 'feature'` tells the
// paywall to hide the onboarding progress dots and lets its Android close
// button return the user to where they were instead of the Home tab.
export const FEATURE_PAYWALL_ROUTE = {
  pathname: '/(onboarding)/paywall',
  params: { context: 'feature' },
} as const;

// Send a free user who tapped a locked feature to the paywall. Pushed (not
// replaced) so the paywall's close button pops back to where they were.
export function presentPaywall(router: Router, feature: FeatureKey): void {
  trackEvent('feature_gate_hit', { feature });
  router.push(FEATURE_PAYWALL_ROUTE);
}

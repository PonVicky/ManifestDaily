import React from 'react';
import PostHog, { PostHogProvider } from 'posthog-react-native';

// PostHog public project key, read from the environment so no key is ever
// hardcoded. EXPO_PUBLIC_ vars are inlined at build time and safe for the
// client (PostHog project keys are write-only / publishable). See .env.example.
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
// Optional override; defaults to PostHog US cloud. Set EXPO_PUBLIC_POSTHOG_HOST
// to 'https://eu.i.posthog.com' for EU, or a self-hosted URL.
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// The set of analytics events this app emits. Keeping it a closed union means
// every trackEvent() call goes through one typed, auditable place.
export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'paywall_viewed'
  | 'feature_gate_hit'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_pending'
  | 'purchase_failed'
  | 'trial_started'
  | 'affirmation_viewed'
  | 'focus_session_completed'
  | 'breathing_exercise_completed'
  | 'vault_entry_created'
  | 'streak_milestone_hit';

// Single PostHog client instance. Null when no API key is configured (e.g. a
// local dev/Expo Go run without env vars) so the app never crashes — trackEvent
// becomes a no-op in that case.
export const posthog: PostHog | null = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })
  : null;

/**
 * The one place all analytics events flow through. Safe to call anywhere; it
 * swallows errors and no-ops when analytics isn't configured.
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (!posthog) {
    if (__DEV__) console.log(`[analytics] (disabled) ${event}`, properties ?? '');
    return;
  }
  try {
    // Values passed here are always JSON-safe (strings/numbers); cast to the
    // exact type capture() expects to satisfy PostHog's stricter JsonType typing.
    posthog.capture(event, properties as Parameters<typeof posthog.capture>[1]);
  } catch (error) {
    if (__DEV__) console.warn('[analytics] capture failed:', error);
  }
}

/**
 * Root-level provider. Wrap the app once with this. Autocapture is disabled so
 * only the explicit trackEvent() calls above are sent — no screen views, no
 * touch/tap capture, no app-lifecycle events. Renders children unchanged when
 * analytics isn't configured.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  if (!posthog) {
    return <>{children}</>;
  }
  return (
    <PostHogProvider client={posthog} autocapture={false}>
      {children}
    </PostHogProvider>
  );
}

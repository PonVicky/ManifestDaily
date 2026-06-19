import * as StoreReview from 'expo-store-review';
import { useAppStore } from '../store/useAppStore';

/**
 * Native App Store / Play Store in-app review prompt.
 *
 * The OS only surfaces the popup a few times a year regardless of how often we
 * ask, so we gate it to a single lifetime attempt — triggered from the 3-day
 * streak milestone, a genuinely positive moment. Never call this during
 * onboarding, on the paywall, or after an error.
 *
 * Best-effort: any failure is swallowed so a missing/unavailable review API
 * can never throw into the UI. We only flip `hasRequestedReview` once we've
 * actually fired the request.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    if (useAppStore.getState().hasRequestedReview) return;

    const available = await StoreReview.isAvailableAsync();
    if (!available || !StoreReview.hasAction()) return;

    await StoreReview.requestReview();
    useAppStore.getState().setHasRequestedReview(true);
  } catch {
    // Swallow — a review prompt is never worth interrupting the user over.
  }
}

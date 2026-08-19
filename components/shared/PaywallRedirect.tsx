import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FEATURE_PAYWALL_ROUTE, FeatureKey } from '../../lib/featureAccess';
import { trackEvent } from '../../lib/analytics';

// Rendered in place of a premium screen when a free Android user lands on it
// (tab tap, Home shortcut, deep link): bounces to the paywall and renders
// nothing. Uses replace — pushing would re-mount the gated screen when the
// paywall is dismissed and bounce forever.
export default function PaywallRedirect({ feature }: { feature: FeatureKey }) {
  const router = useRouter();

  useEffect(() => {
    trackEvent('feature_gate_hit', { feature });
    router.replace(FEATURE_PAYWALL_ROUTE);
  }, [feature, router]);

  return null;
}

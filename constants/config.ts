import { Platform } from 'react-native';

// TODO(temporary): skip the paywall SCREEN on Android until Play Console
// products are live and mapped to the `default2` offering in RevenueCat —
// until then it shows fallback prices and a buy button that can't complete.
// This only controls whether the screen is shown; feature access is handled
// separately by ANDROID_FREE_FEATURES in lib/featureAccess.ts. Flip to `false`
// to restore the Android paywall — no other change is needed. iOS ignores it.
export const HIDE_ANDROID_PAYWALL = true;

// True when the paywall screen must not be navigated to on this device.
// Always false on iOS.
export const isPaywallHidden = (): boolean =>
  Platform.OS === 'android' && HIDE_ANDROID_PAYWALL;
